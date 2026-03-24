import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, X, Volume2, VolumeX, Loader2, Sparkles, Brain, User, Bot } from 'lucide-react';
import { getGemini } from '../services/geminiService';
import { LiveServerMessage, Modality } from "@google/genai";
import { cn } from '../utils';

interface LiveVoiceChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveVoiceChat: React.FC<LiveVoiceChatProps> = ({ isOpen, onClose }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  const startSession = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      const ai = getGemini();

      // Initialize Audio Context
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      
      // Setup Audio Output
      const playNextChunk = async () => {
        if (audioQueueRef.current.length === 0) {
          isPlayingRef.current = false;
          setIsSpeaking(false);
          return;
        }

        isPlayingRef.current = true;
        setIsSpeaking(true);
        const chunk = audioQueueRef.current.shift()!;
        
        const buffer = audioContextRef.current!.createBuffer(1, chunk.length, 16000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < chunk.length; i++) {
          channelData[i] = chunk[i] / 32768.0;
        }

        const source = audioContextRef.current!.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current!.destination);
        source.onended = playNextChunk;
        source.start();
      };

      // Connect to Live API
      sessionRef.current = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "أنت Novel، مساعد صوتي ذكي وودود. تحدث باللغة العربية بطلاقة. كن موجزاً وواضحاً في ردودك. ساعد المستخدم في أي شيء يطلبه.",
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            startMic();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  // Decode base64 audio and add to queue
                  const binaryString = atob(part.inlineData.data);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  const int16Data = new Int16Array(bytes.buffer);
                  audioQueueRef.current.push(int16Data);
                  if (!isPlayingRef.current) playNextChunk();
                }
              }
            }
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              setIsSpeaking(false);
            }
          },
          onclose: () => {
            stopSession();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("حدث خطأ في الاتصال الصوتي.");
            stopSession();
          }
        }
      });

    } catch (err) {
      console.error("Failed to start live session:", err);
      setError("فشل بدء الجلسة الصوتية. تأكد من صلاحيات الميكروفون.");
      setIsConnecting(false);
    }
  };

  const startMic = async () => {
    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current!.createMediaStreamSource(mediaStreamRef.current);
      
      // Simple processor to send audio chunks
      const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        if (isMuted || !sessionRef.current) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Simple speech detection
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += Math.abs(inputData[i]);
        }
        const average = sum / inputData.length;
        setIsUserSpeaking(average > 0.01);

        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          int16Data[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(int16Data.buffer)));
        sessionRef.current.sendRealtimeInput({
          audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current!.destination);
    } catch (err) {
      console.error("Mic Error:", err);
      setError("لا يمكن الوصول إلى الميكروفون.");
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    setIsUserSpeaking(false);
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  useEffect(() => {
    if (isOpen) {
      startSession();
    } else {
      stopSession();
    }
    return () => stopSession();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-lg glass-panel rounded-[40px] border-white/5 p-12 flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent transition-opacity duration-1000",
              isSpeaking ? "opacity-100" : "opacity-0"
            )} />

            <button 
              onClick={onClose}
              className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full text-zinc-400 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative mb-12">
              <div className={cn(
                "w-32 h-32 rounded-full flex items-center justify-center relative z-10 transition-all duration-500",
                isConnected ? "bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]" : "bg-zinc-800"
              )}>
                {isConnecting ? (
                  <Loader2 className="w-12 h-12 text-zinc-400 animate-spin" />
                ) : isConnected ? (
                  <Sparkles className="w-12 h-12 text-white animate-pulse" />
                ) : (
                  <MicOff className="w-12 h-12 text-zinc-500" />
                )}
              </div>
              
              {/* Pulse Rings */}
              {isSpeaking && (
                <>
                  <motion.div 
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
                  />
                  <motion.div 
                    animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="absolute inset-0 rounded-full border-2 border-emerald-500/20"
                  />
                </>
              )}
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              {isConnecting ? "جاري الاتصال..." : isConnected ? "Novel تستمع إليك" : "غير متصل"}
            </h2>
            
            <p className="text-zinc-400 mb-12 max-w-xs">
              {error || (isConnected ? "Novel تستمع إليك الآن..." : "تأكد من اتصالك بالإنترنت وصلاحيات الميكروفون.")}
            </p>

            {/* Enhanced Sound Wave Visualization */}
            <div className="flex items-end justify-center gap-1.5 h-16 mb-12">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: (isSpeaking || isUserSpeaking) ? [12, Math.random() * 40 + 20, 12] : 8,
                    opacity: (isSpeaking || isUserSpeaking) ? [0.4, 1, 0.4] : 0.2
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.05,
                    ease: "easeInOut"
                  }}
                  className={cn(
                    "w-1.5 rounded-full transition-colors duration-500",
                    isSpeaking ? "bg-emerald-500" : isUserSpeaking ? "bg-blue-500" : "bg-zinc-700"
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
                  isMuted ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                )}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              
              <button
                onClick={onClose}
                className="px-8 h-16 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                إنهاء المكالمة
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
