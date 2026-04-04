import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, X, Volume2, VolumeX, Loader2, Sparkles, Brain, User, Bot, Settings2 } from 'lucide-react';
import { getGemini } from './geminiService';
import { LiveServerMessage, Modality } from "@google/genai";
import { cn } from './utils';

interface LiveVoiceChatProps {
  isOpen: boolean;
  onClose: () => void;
}

type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export const LiveVoiceChat: React.FC<LiveVoiceChatProps> = ({ isOpen, onClose }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [showSettings, setShowSettings] = useState(false);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const isPlayingRef = useRef(false);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const startSession = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      const ai = getGemini();

      // Initialize Audio Context
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      nextPlayTimeRef.current = 0;
      
      // Setup Audio Output
      const scheduleAudioChunk = (int16Data: Int16Array) => {
        if (!audioContextRef.current) return;
        
        isPlayingRef.current = true;
        setIsSpeaking(true);
        
        const buffer = audioContextRef.current.createBuffer(1, int16Data.length, 16000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < int16Data.length; i++) {
          channelData[i] = int16Data[i] / 32768.0;
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        
        const currentTime = audioContextRef.current.currentTime;
        if (nextPlayTimeRef.current < currentTime) {
          nextPlayTimeRef.current = currentTime;
        }
        
        source.start(nextPlayTimeRef.current);
        nextPlayTimeRef.current += buffer.duration;
        
        source.onended = () => {
          if (audioContextRef.current && audioContextRef.current.currentTime >= nextPlayTimeRef.current) {
            isPlayingRef.current = false;
            setIsSpeaking(false);
          }
        };
      };

      // Connect to Live API
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
          },
          systemInstruction: "أنت Novel، مساعدة صوتية ذكية وودودة جداً. تحدثي باللغة العربية بطلاقة ونبرة صوت إنسانية دافئة. كوني موجزة وواضحة في ردودك، واستخدمي تعبيرات بشرية طبيعية. ساعدي المستخدم في أي شيء يطلبه.",
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
                  // Decode base64 audio and schedule
                  const binaryString = atob(part.inlineData.data);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  const int16Data = new Int16Array(bytes.buffer);
                  scheduleAudioChunk(int16Data);
                }
              }
            }
            if (message.serverContent?.interrupted) {
              nextPlayTimeRef.current = audioContextRef.current?.currentTime || 0;
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
      sessionRef.current = sessionPromise;

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
      processorRef.current = processor;
      
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

        // Convert to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
        }

        // Convert to base64
        const buffer = new Uint8Array(pcmData.buffer);
        let binary = '';
        for (let i = 0; i < buffer.byteLength; i++) {
          binary += String.fromCharCode(buffer[i]);
        }
        const base64Data = btoa(binary);

        sessionRef.current.then((session: any) => {
          session.sendRealtimeInput({
            audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        }).catch(() => {});
      };

      source.connect(processor);
      processor.connect(audioContextRef.current!.destination);
    } catch (err) {
      console.error("Mic error:", err);
      setError("لا يمكن الوصول للميكروفون.");
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => {
        try {
          session.close();
        } catch (e) {
          console.warn("Error closing session:", e);
        }
      }).catch(() => {});
      sessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
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

  // Restart session when voice changes if already connected
  useEffect(() => {
    if (isConnected && !isConnecting) {
      stopSession();
      setTimeout(() => {
        startSession();
      }, 500);
    }
  }, [selectedVoice]);

  const voices: { id: VoiceName, name: string, type: string }[] = [
    { id: 'Kore', name: 'كوري (Kore)', type: 'أنثوي هادئ' },
    { id: 'Charon', name: 'كارون (Charon)', type: 'رجالي عميق' },
    { id: 'Fenrir', name: 'فنرير (Fenrir)', type: 'رجالي قوي' },
    { id: 'Puck', name: 'باك (Puck)', type: 'رجالي حيوي' },
    { id: 'Zephyr', name: 'زيفير (Zephyr)', type: 'رجالي هادئ' },
  ];

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
              className="absolute top-8 left-8 p-2 hover:bg-white/10 rounded-full text-zinc-400 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full text-zinc-400 transition-colors"
            >
              <Settings2 className="w-6 h-6" />
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
            
            <p className="text-zinc-400 mb-8 max-w-xs h-6">
              {error || (isConnected ? "Novel تستمع إليك الآن..." : "تأكد من اتصالك بالإنترنت وصلاحيات الميكروفون.")}
            </p>

            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full mb-8 bg-black/20 p-4 rounded-2xl border border-white/5"
                >
                  <h3 className="text-sm font-medium text-zinc-300 mb-3 text-right">اختر شخصية الصوت:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {voices.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVoice(v.id as VoiceName)}
                        className={cn(
                          "text-xs p-2 rounded-xl border text-right transition-colors flex flex-col",
                          selectedVoice === v.id 
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" 
                            : "border-white/10 text-zinc-400 hover:bg-white/5"
                        )}
                      >
                        <span className="font-bold">{v.name}</span>
                        <span className="text-[10px] opacity-70">{v.type}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
