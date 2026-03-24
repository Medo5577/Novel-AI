/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Paperclip, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  Trash2,
  Download,
  PlusCircle,
  Menu,
  X,
  Volume2,
  Globe,
  ExternalLink,
  AlertCircle,
  Brain,
  BookOpen,
  Briefcase,
  Table as TableIcon,
  Clock,
  Calendar,
  FileText,
  ArrowRight,
  Mic,
  History,
  Settings,
  Database,
  CreditCard,
  LogOut,
  LogIn,
  Plus,
  RefreshCw,
  User as UserIcon,
  Brain as BrainIcon,
  Sparkles as SparklesIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { motion, AnimatePresence } from 'motion/react';
import { streamChat, generateImage, textToSpeech, analyzeConversation, Message, AppMode, parseArtifacts, MODE_PROMPTS, generateContextualSuggestions, generateChatSummary } from './services/geminiService';
import { cn } from './utils';
import { InteractiveTable } from './components/InteractiveTable';
import { CVStudio } from './components/CVStudio';
import { QuizBlock } from './components/QuizBlock';
import { ChartBlock } from './components/ChartBlock';
import { LandingPage } from './components/LandingPage';
import { LiveVoiceChat } from './components/LiveVoiceChat';
import { SubscriptionManager } from './components/SubscriptionManager';
import { EmbeddingsTool } from './components/EmbeddingsTool';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { CodeSandbox } from './components/CodeSandbox';
import { PersonaBuilder } from './components/PersonaBuilder';
import { getUserSubscription, Subscription } from './services/subscriptionService';
import { streamOpenRouterWithFailover, FREE_MODELS, clearBlacklist } from './services/openRouterService';
import { auth } from './services/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import { db } from './services/firebase';
import { getUserProfile, saveUserProfile, addMemory, addSkill, updatePreference, UserProfile } from './services/userService';
import { saveChat, getUserChats, deleteChat, ChatSession } from './services/chatService';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-zinc-950 p-6">
          <div className="max-w-md w-full glass-panel p-8 rounded-3xl text-center space-y-4 border-red-500/20">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
            <p className="text-zinc-400 text-sm">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors font-medium"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function NovelApp() {
  const [showLanding, setShowLanding] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<{ id: string; title: string; summary?: string; messages: Message[] }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [deepThinking, setDeepThinking] = useState(false);
  const [mode, setMode] = useState<AppMode>('General');
  const [attachment, setAttachment] = useState<{ mimeType: string; data: string; name: string } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const [showSubscription, setShowSubscription] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [user, setUser] = useState(auth.currentUser);
  const [selectedFreeModel, setSelectedFreeModel] = useState("openrouter/free");
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [showSettings, setShowSettings] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({ skills: [], preferences: {}, memories: [] });

  const t = {
    ar: {
      newChat: "محادثة جديدة",
      quickActions: "إجراءات سريعة",
      upgrade: "ترقية",
      subscription: "الاشتراك",
      liveChat: "تحدث لايف",
      systemActive: "نظام نشط",
      thinking: "تفكير عميق",
      freeModel: "الموديل المجاني",
      modelDesc: "محرك ذكي يختار أفضل الموديلات المجانية تلقائياً لضمان السرعة والدقة.",
      intelligenceMode: "وضع الذكاء",
      advancedTools: "الأدوات المتقدمة",
      chatHistory: "سجل المحادثات",
      scheduledTasks: "المهام المجدولة",
      smartMemory: "ذاكرة Novel الذكية",
      embeddingsTool: "أداة الـ Embeddings",
      settings: "الإعدادات",
      customizePersona: "تخصيص الشخصية",
      resetBlacklist: "إعادة ضبط قائمة الحظر",
      clearHistory: "مسح السجل",
      language: "اللغة",
      arabic: "العربية",
      english: "English",
      howCanIHelp: "كيف يمكنني مساعدتك اليوم؟",
      novelDesc: "أنا Novel، رفيقك الذكي المتكامل. يمكنني مساعدتك في الكتابة، البرمجة، إنشاء السير الذاتية الاحترافية، أو حتى المهام التحليلية العميقة.",
      messagePlaceholder: "أرسل رسالة لـ Novel AI...",
      general: "عام",
      study: "دراسة",
      professional: "احترافي",
      data: "بيانات",
      assistant: "مساعد",
      resetSuccess: "تمت إعادة ضبط قائمة الموديلات المحظورة والموديل المختار بنجاح.",
      resetFail: "فشل في إعادة ضبط القائمة.",
      clearHistoryConfirm: "هل أنت متأكد من مسح سجل المحادثات؟",
      schedulerTitle: "جدولة مهام الوكيل",
      schedulerDesc: "قم بجدولة مهام تلقائية ليقوم بها Novel AI في وقت محدد.",
      addNewTask: "إضافة مهمة جديدة",
      taskPlaceholder: "ماذا تريد من الوكيل أن يفعل؟",
      scheduleNow: "جدولة الوكيل الآن",
      scheduledTasksTitle: "المهام المجدولة",
      noTasks: "لا توجد مهام مجدولة حالياً",
      executionLog: "سجل التنفيذ",
      logEmpty: "السجل فارغ",
      pending: "قيد الانتظار",
      executed: "تم التنفيذ",
      execution: "تنفيذ",
      system: "نظام",
      memoryTitle: "ذاكرة Novel الذكية",
      memoryDesc: "هنا يتم تخزين مهاراتك، تفضيلاتك، وما تعلمته Novel عنك لتحسين تجربتك.",
      userProfile: "ملف المستخدم",
      profileDesc: "بياناتك الشخصية ومهاراتك",
      discoveredSkills: "المهارات المكتشفة",
      noSkills: "لم يتم اكتشاف مهارات بعد...",
      preferences: "التفضيلات",
      noPreferences: "لا توجد تفضيلات مسجلة...",
      howMemoryWorks: "كيف تعمل الذاكرة؟",
      memoryMechanism: "تقوم Novel بتحليل محادثاتك تلقائياً لاستخراج المهارات والاهتمامات. كلما تحدثت أكثر، أصبحت Novel أكثر ذكاءً في تخصيص الإجابات لك.",
      memoriesHistory: "سجل الذكريات (آخر 50)",
      memoryEmpty: "ذاكرة Novel فارغة حالياً. ابدأ بالتحدث معها لتبني ذكرياتها!",
      noHistory: "لا يوجد سجل محادثات بعد.",
      untitled: "بدون عنوان",
      suggestion1: "أنشئ سيرة ذاتية احترافية لمطور ويب",
      suggestion2: "اشرح فيزياء الكم خطوة بخطوة",
      suggestion3: "حلل هذه البيانات وأنشئ جدول ملخص",
      suggestion4: "أنشئ صورة لمناظر طبيعية مستقبلية عالية الجودة",
      attachment: "مرفق",
      documentAttached: "تم إرفاق مستند"
    },
    en: {
      newChat: "New Chat",
      quickActions: "Quick Actions",
      upgrade: "Upgrade",
      subscription: "Subscription",
      liveChat: "Live Chat",
      systemActive: "System Active",
      thinking: "Deep Thinking",
      freeModel: "Free Model",
      modelDesc: "Smart engine that automatically selects the best free models for speed and accuracy.",
      intelligenceMode: "Intelligence Mode",
      advancedTools: "Advanced Tools",
      chatHistory: "Chat History",
      scheduledTasks: "Scheduled Tasks",
      smartMemory: "Novel Smart Memory",
      embeddingsTool: "Embeddings Tool",
      settings: "Settings",
      customizePersona: "Customize Persona",
      resetBlacklist: "Reset Model Blacklist",
      clearHistory: "Clear History",
      language: "Language",
      arabic: "Arabic",
      english: "English",
      howCanIHelp: "How can I help you today?",
      novelDesc: "I am Novel, your all-in-one smart companion. I can help you with writing, coding, professional CVs, or deep analytical tasks.",
      messagePlaceholder: "Message Novel AI...",
      general: "General",
      study: "Study",
      professional: "Professional",
      data: "Data",
      assistant: "Assistant",
      resetSuccess: "Model blacklist and selected model reset successfully.",
      resetFail: "Failed to reset the list.",
      clearHistoryConfirm: "Are you sure you want to clear chat history?",
      schedulerTitle: "Agent Task Scheduler",
      schedulerDesc: "Schedule automatic tasks for Novel AI to perform at a specific time.",
      addNewTask: "Add New Task",
      taskPlaceholder: "What do you want the agent to do?",
      scheduleNow: "Schedule Agent Now",
      scheduledTasksTitle: "Scheduled Tasks",
      noTasks: "No scheduled tasks currently",
      executionLog: "Execution Log",
      logEmpty: "Log is empty",
      pending: "Pending",
      executed: "Executed",
      execution: "Execution",
      system: "System",
      memoryTitle: "Novel Smart Memory",
      memoryDesc: "This is where your skills, preferences, and what Novel has learned about you are stored to improve your experience.",
      userProfile: "User Profile",
      profileDesc: "Your personal data and skills",
      discoveredSkills: "Discovered Skills",
      noSkills: "No skills discovered yet...",
      preferences: "Preferences",
      noPreferences: "No preferences recorded...",
      howMemoryWorks: "How does memory work?",
      memoryMechanism: "Novel automatically analyzes your conversations to extract skills and interests. The more you talk, the smarter Novel becomes in personalizing answers for you.",
      memoriesHistory: "Memories History (Last 50)",
      memoryEmpty: "Novel's memory is currently empty. Start talking to it to build its memories!",
      noHistory: "No chat history yet.",
      untitled: "Untitled",
      suggestion1: "Create a professional CV for a Web Developer",
      suggestion2: "Explain Quantum Physics step-by-step",
      suggestion3: "Analyze this data and create a summary table",
      suggestion4: "Generate a high-quality futuristic landscape",
      attachment: "Attachment",
      documentAttached: "Document Attached"
    }
  }[language];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        setShowLanding(false);

        // Test connection
        const testConnection = async () => {
          try {
            await getDocFromServer(doc(db, 'users', user.uid));
          } catch (error) {
            if (error instanceof Error && error.message.includes('the client is offline')) {
              console.error("Please check your Firebase configuration. The client is offline.");
            }
          }
        };
        testConnection();

        // Ensure user exists in Firestore
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: 'user',
            skills: [],
            preferences: {},
            memories: [],
            createdAt: new Date().toISOString()
          });
        }
        
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);

        const userChats = await getUserChats(user.uid);
        setHistory(userChats.map(c => ({ id: c.id, title: c.title, summary: c.summary, messages: c.messages })));
        
        const sub = await getUserSubscription();
        setSubscription(sub);
      } else {
        setSubscription(null);
        setUserProfile({ skills: [], preferences: {}, memories: [] });
        setHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleEmailLogin = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const handleEmailRegister = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const handleResetBlacklist = async () => {
    try {
      clearBlacklist(); // Local
      await fetch('/api/chat/openrouter/blacklist', { method: 'DELETE' }); // Server
      setSelectedFreeModel("openrouter/free");
      alert(t.resetSuccess);
    } catch (e) {
      console.error(e);
      alert(t.resetFail);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm(t.clearHistoryConfirm)) {
      if (user) {
        for (const chat of history) {
          await deleteChat(chat.id.toString());
        }
      }
      setMessages([]);
      setHistory([]);
      setCurrentChatId(null);
    }
  };

  const [activeTab, setActiveTab] = useState<'chat' | 'scheduler' | 'history' | 'memory' | 'embeddings'>('chat');
  const [contextualSuggestions, setContextualSuggestions] = useState<string[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskLogs, setTaskLogs] = useState<any[]>([]);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [typingSoundEnabled, setTypingSoundEnabled] = useState(true);
  const [showPersonaBuilder, setShowPersonaBuilder] = useState(false);
  const [customPersona, setCustomPersona] = useState<any>(null);
  const [newTask, setNewTask] = useState({ task: '', time: '' });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  useEffect(() => {
    if (typingSoundEnabled && isTyping && messages[messages.length - 1]?.role === 'model') {
      if (!typingAudioRef.current) {
        typingAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        typingAudioRef.current.loop = true;
        typingAudioRef.current.volume = 0.1;
      }
      typingAudioRef.current.play().catch(() => {});
    } else {
      typingAudioRef.current?.pause();
    }
  }, [isTyping, typingSoundEnabled, messages]);

  useEffect(() => {
    fetchTasks();
    fetchLogs();
    const savedHistory = localStorage.getItem('nova_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const interval = setInterval(() => {
      fetchTasks();
      fetchLogs();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      }
    };
    loadProfile();
  }, [activeTab, user]);

  const saveToHistory = async (msgs: Message[]) => {
    if (msgs.length === 0 || !user) return;
    
    let summary = "";
    if (msgs.length >= 2) {
      summary = await generateChatSummary(msgs, language);
    }
    
    const chatId = await saveChat(user.uid, msgs, currentChatId || undefined, undefined, summary);
    if (!currentChatId) setCurrentChatId(chatId);
    
    const userChats = await getUserChats(user.uid);
    setHistory(userChats.map(c => ({ id: c.id, title: c.title, summary: c.summary, messages: c.messages })));
  };

  const loadHistory = (h: any) => {
    setMessages(h.messages);
    setCurrentChatId(h.id.toString());
    setActiveTab('chat');
    setIsSidebarOpen(false);
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data);
    } catch (e) { console.error(e); }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      setTaskLogs(data);
    } catch (e) { console.error(e); }
  };

  const addTask = async () => {
    if (!newTask.task || !newTask.time) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      const data = await res.json();
      setTasks(data.tasks);
      setNewTask({ task: '', time: '' });
    } catch (e) { console.error(e); }
  };

  if (showLanding) {
    return (
      <LandingPage 
        onStart={() => setShowLanding(false)} 
        onLogin={handleLogin}
        onEmailLogin={handleEmailLogin}
        onEmailRegister={handleEmailRegister}
        language={language} 
        isLoggedIn={!!user}
      />
    );
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !attachment) || isTyping) return;

    // Auto-learning logic
    if (user) {
      analyzeConversation(input, language).then(async (analysis) => {
        if (analysis.skills && analysis.skills.length > 0) {
          for (const skill of analysis.skills) {
            await addSkill(user.uid, skill);
          }
        }
        if (analysis.preferences) {
          for (const [key, value] of Object.entries(analysis.preferences)) {
            await updatePreference(user.uid, key, value as string);
          }
        }
        if (analysis.memory) {
          await addMemory(user.uid, analysis.memory);
        }
        const updatedProfile = await getUserProfile(user.uid);
        setUserProfile(updatedProfile);
      }).catch(e => console.error("Auto-learning failed:", e));
    }

    // Handle /resume command
    if (input.trim().toLowerCase().startsWith('/resume')) {
      setMode('Professional');
    }

    const userMessage: Message = {
      role: 'user',
      parts: [
        { text: input },
        ...(attachment ? [{ inlineData: { mimeType: attachment.mimeType, data: attachment.data } }] : [])
      ],
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachment(null);
    setIsTyping(true);
    setContextualSuggestions([]);

    // Smart Mode Logic
    let currentMode = mode;
    if (mode === 'General') {
      const studyKeywords = /study|learn|explain|exam|homework|درس|تعلم|شرح|امتحان|واجب/i;
      const professionalKeywords = /work|job|cv|resume|interview|business|عمل|وظيفة|سيرة ذاتية|مقابلة|بزنس/i;
      const dataKeywords = /data|analyze|chart|table|excel|csv|بيانات|تحليل|رسم بياني|جدول/i;

      if (studyKeywords.test(input)) currentMode = 'Study';
      else if (professionalKeywords.test(input)) currentMode = 'Professional';
      else if (dataKeywords.test(input)) currentMode = 'Data';
      
      if (currentMode !== mode) {
        setMode(currentMode);
      }
    }

    const isImageRequest = /generate image|create image|draw|صورة|ارسم/i.test(input);
    let fullResponse = '';

    try {
      if (isImageRequest) {
        const imageUrl = await generateImage(input);
        const modelMessage: Message = {
          role: 'model',
          parts: [{ text: language === 'ar' ? `تم إنشاء صورة لـ: ${input}` : `Generated image for: ${input}` }, { inlineData: { mimeType: 'image/png', data: imageUrl.split(',')[1] } }],
          timestamp: Date.now(),
          type: 'image'
        };
        setMessages(prev => [...prev, modelMessage]);
      } else {
        const modelMessage: Message = {
          role: 'model',
          parts: [{ text: '' }],
          timestamp: Date.now(),
        };
        
        setMessages(prev => [...prev, modelMessage]);

        // Use OpenRouter for both paid and free models
        const useOpenRouter = (subscription && subscription.status === 'active' && subscription.selectedModels.length > 0) || !subscription;
        
        if (useOpenRouter) {
          const profileContext = userProfile ? `\n\nUser Context:\n- Name: ${userProfile.displayName || 'Unknown'}\n- Skills: ${userProfile.skills.join(', ') || 'None'}\n- Memories: ${userProfile.memories.slice(-5).map(m => m.content).join('; ') || 'None'}` : '';
          const systemPrompt = MODE_PROMPTS[mode] + profileContext;
          const openRouterMessages = [
            { role: "system", content: systemPrompt },
            ...messages.map(msg => ({
              role: msg.role === "model" ? "assistant" : "user",
              content: msg.parts[0].text || ""
            })),
            { role: "user", content: userMessage.parts[0].text || "" }
          ];
          
          // If subscribed, use first selected model. If not, use selected free model.
          const model = (subscription && subscription.status === 'active' && subscription.selectedModels.length > 0) 
            ? subscription.selectedModels[0] 
            : selectedFreeModel;
            
          const stream = streamOpenRouterWithFailover(model, openRouterMessages);
          
          for await (const chunk of stream) {
            fullResponse += chunk;
            const { cleanText, artifacts } = parseArtifacts(fullResponse);
            
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg.role === 'model') {
                lastMsg.parts[0].text = cleanText;
                lastMsg.artifacts = artifacts;
              }
              return newMessages;
            });
          }
          
          // Save to history after stream completes
          if (user) {
            const finalMessages: Message[] = [...messages, userMessage, {
              role: 'model',
              parts: [{ text: fullResponse }],
              timestamp: Date.now()
            }];
            await saveToHistory(finalMessages);
          }
        } else {
          // This branch is only reached if there's a subscription but no models selected (unlikely)
          const profileContext = userProfile ? `\n\nUser Context:\n- Name: ${userProfile.displayName || 'Unknown'}\n- Skills: ${userProfile.skills.join(', ') || 'None'}\n- Memories: ${userProfile.memories.slice(-5).map(m => m.content).join('; ') || 'None'}` : '';
          const systemPrompt = MODE_PROMPTS[mode] + profileContext;
          const stream = streamChat([...messages, userMessage], {
            mode,
            useSearch,
            deepThinking,
            customPersona,
            profile: userProfile
          });
          
          for await (const chunk of stream) {
            fullResponse += chunk.text;
            const { cleanText, artifacts } = parseArtifacts(fullResponse);
            
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg.role === 'model') {
                lastMsg.parts[0].text = cleanText;
                lastMsg.artifacts = artifacts;
                if (chunk.groundingMetadata?.groundingChunks) {
                  lastMsg.isGroundingUsed = true;
                  lastMsg.groundingUrls = chunk.groundingMetadata.groundingChunks
                    .map((c: any) => c.web?.uri)
                    .filter(Boolean);
                }
              }
              return newMessages;
            });
          }

          // Save to history after stream completes
          if (user) {
            const finalMessages: Message[] = [...messages, userMessage, {
              role: 'model',
              parts: [{ text: fullResponse }],
              timestamp: Date.now()
            }];
            await saveToHistory(finalMessages);
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'model',
        parts: [{ text: language === 'ar' ? "أعتذر، حدث خطأ ما. يرجى المحاولة مرة أخرى." : "I apologize, but I encountered an error. Please try again." }],
        timestamp: Date.now(),
      }]);
    } finally {
      setIsTyping(false);
      if (fullResponse) {
        generateContextualSuggestions(fullResponse, language).then(setContextualSuggestions);
      }
    }
  };

  const handleSpeech = async (text: string, index: number) => {
    if (isSpeaking === index) {
      audioRef.current?.pause();
      setIsSpeaking(null);
      return;
    }

    try {
      setIsSpeaking(index);
      const audioUrl = await textToSpeech(text);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        audioRef.current.onended = () => setIsSpeaking(null);
      } else {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play();
        audio.onended = () => setIsSpeaking(null);
      }
    } catch (error) {
      console.error("Speech error:", error);
      setIsSpeaking(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAttachment({
        mimeType: file.type,
        data: base64.split(',')[1],
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] glass-panel border-r border-white/5 p-4 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <Sparkles className="w-6 h-6 text-white relative z-10" />
                </div>
                <h1 className="text-2xl font-black tracking-tighter text-white bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent italic">Novel AI</h1>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => { 
                if (messages.length > 0) saveToHistory(messages);
                setMessages([]); 
                setActiveTab('chat');
                setIsSidebarOpen(false); 
              }}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 text-sm font-bold mb-6"
            >
              <PlusCircle className="w-4 h-4" />
              {t.newChat}
            </button>

            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Mobile Quick Actions */}
              <div className="md:hidden space-y-2 px-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">{t.quickActions}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setShowSubscription(true);
                      setIsSidebarOpen(false);
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-800 text-zinc-300 border border-white/5 font-bold text-[10px]"
                  >
                    <CreditCard className="w-4 h-4" />
                    {subscription?.status === 'active' ? t.subscription : t.upgrade}
                  </button>
                  <button
                    onClick={() => {
                      setIsLiveVoiceOpen(true);
                      setIsSidebarOpen(false);
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-bold text-[10px]"
                  >
                    <Mic className="w-4 h-4" />
                    {t.liveChat}
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-medium text-emerald-400">{t.systemActive}</span>
                  </div>
                  {deepThinking && (
                    <div className="flex items-center gap-2">
                      <Brain className="w-3 h-3 text-purple-400" />
                      <span className="text-[10px] font-medium text-purple-400 uppercase tracking-wider">{t.thinking}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Free Model Selection (Only for non-subscribed users) */}
              {!subscription && (
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-2 mb-4">{t.freeModel}</p>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-bold">Novel X.1</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 px-2 italic">
                    {t.modelDesc}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-2 mb-4">{t.intelligenceMode}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'General', icon: Bot, label: t.general },
                    { id: 'Study', icon: BookOpen, label: t.study },
                    { id: 'Professional', icon: Briefcase, label: t.professional },
                    { id: 'Data', icon: TableIcon, label: t.data },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id as AppMode)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                        mode === m.id 
                          ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
                          : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                      )}
                    >
                      <m.icon className="w-4 h-4" />
                      <span className="text-[10px] font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-2 mb-4">{t.advancedTools}</p>
                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveTab('history')}
                    className={cn(
                      "flex items-center justify-between w-full p-3 rounded-xl border transition-all",
                      activeTab === 'history' ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{t.chatHistory}</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('scheduler')}
                    className={cn(
                      "flex items-center justify-between w-full p-3 rounded-xl border transition-all",
                      activeTab === 'scheduler' ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{t.scheduledTasks}</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('memory')}
                    className={cn(
                      "flex items-center justify-between w-full p-3 rounded-xl border transition-all",
                      activeTab === 'memory' ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <BrainIcon className="w-4 h-4" />
                      <span className="text-sm">{t.smartMemory}</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('embeddings')}
                    className={cn(
                      "flex items-center justify-between w-full p-3 rounded-xl border transition-all",
                      activeTab === 'embeddings' ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      <span className="text-sm">{t.embeddingsTool}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
              {user ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                      {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : user.displayName?.[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">{user.displayName}</span>
                      <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">{user.email}</span>
                    </div>
                  </div>
                  <button onClick={() => signOut(auth)} className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-500 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 text-sm font-bold"
                >
                  <LogIn className="w-4 h-4" />
                  {language === 'ar' ? 'تسجيل الدخول بجوجل' : 'Login with Google'}
                </button>
              )}
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-3 w-full p-3 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/5 transition-colors text-sm font-medium"
              >
                <Settings className="w-4 h-4" />
                {t.settings}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-16 glass-panel border-b border-white/5 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/5 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 group cursor-pointer overflow-hidden">
              <div className="relative shrink-0">
                <motion.div 
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000"
                />
                <div className="relative w-7 h-7 md:w-9 md:h-9 rounded-lg bg-zinc-900 flex items-center justify-center border border-white/10 shadow-lg overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 group-hover:text-white transition-all duration-500 group-hover:scale-110" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-base md:text-xl font-black tracking-tighter bg-gradient-to-r from-white via-emerald-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(16,185,129,0.2)] group-hover:drop-shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all">
                  Novel AI
                </span>
                <span className="text-[7px] md:text-[9px] text-zinc-500 font-bold -mt-0.5 uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{t.assistant} [{mode}]</span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {subscription?.status === 'active' && (
              <div className="flex items-center gap-1 p-1 bg-zinc-900/50 rounded-xl border border-white/5">
                <button
                  onClick={() => setSelectedFreeModel("gemini")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    selectedFreeModel === "gemini" ? "bg-emerald-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Gemini
                </button>
                <button
                  onClick={() => setSelectedFreeModel("openrouter/free")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    selectedFreeModel === "openrouter/free" ? "bg-blue-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  OpenRouter
                </button>
              </div>
            )}
            <button
              onClick={() => setShowSubscription(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all border border-white/5 font-bold text-sm"
            >
              <CreditCard className="w-4 h-4" />
              {subscription?.status === 'active' ? t.subscription : t.upgrade}
            </button>
            <button
              onClick={() => setIsLiveVoiceOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 font-bold text-sm"
            >
              <Mic className="w-4 h-4" />
              {t.liveChat}
            </button>
            {deepThinking && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                <Brain className="w-3 h-3 text-purple-400" />
                <span className="text-[10px] font-medium text-purple-400 uppercase tracking-wider">{t.thinking}</span>
              </div>
            )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">{t.systemActive}</span>
          </div>
          </div>
        </header>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth"
        >
          {activeTab === 'scheduler' ? (
            <div className="max-w-2xl mx-auto space-y-8 py-12 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">{t.schedulerTitle}</h2>
                  <p className="text-zinc-500 text-sm mt-1">{t.schedulerDesc}</p>
                </div>
                <button onClick={() => setActiveTab('chat')} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="glass-panel p-8 rounded-[32px] space-y-6 border-white/10">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">{t.addNewTask}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <Bot className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        value={newTask.task}
                        onChange={e => setNewTask({...newTask, task: e.target.value})}
                        placeholder={t.taskPlaceholder}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="time"
                        value={newTask.time}
                        onChange={e => setNewTask({...newTask, time: e.target.value})}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={addTask}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" /> {t.scheduleNow}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-2">{t.scheduledTasksTitle}</h3>
                  <div className="space-y-3">
                    {tasks.length === 0 ? (
                      <div className="p-8 text-center glass-panel rounded-3xl border-dashed border-white/5">
                        <p className="text-zinc-600 text-sm italic">{t.noTasks}</p>
                      </div>
                    ) : (
                      tasks.map(t_task => (
                        <div key={t_task.id} className="flex items-center justify-between p-5 glass-panel rounded-2xl border-white/5 group">
                          <div className="flex items-center gap-4">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", t_task.status === 'pending' ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-500")}>
                              <Bot className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{t_task.task}</p>
                              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">{t_task.time} • {t_task.status === 'pending' ? t.pending : t.executed}</p>
                            </div>
                          </div>
                          <button 
                            onClick={async () => {
                              await fetch(`/api/tasks/${t_task.id}`, { method: 'DELETE' });
                              fetchTasks();
                            }}
                            className="p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-2">{t.executionLog}</h3>
                  <div className="space-y-3">
                    {taskLogs.length === 0 ? (
                      <div className="p-8 text-center glass-panel rounded-3xl border-dashed border-white/5">
                        <p className="text-zinc-600 text-sm italic">{t.logEmpty}</p>
                      </div>
                    ) : (
                      taskLogs.slice().reverse().slice(0, 10).map(log => (
                        <div key={log.id} className="p-4 glass-panel rounded-2xl border-white/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded", log.type === 'success' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500")}>
                              {log.type === 'success' ? t.execution : t.system}
                            </span>
                            <span className="text-[10px] text-zinc-600 font-mono">
                              {new Date(log.timestamp).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US')}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">{log.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'embeddings' ? (
            <EmbeddingsTool />
          ) : activeTab === 'memory' ? (
            <div className="max-w-4xl mx-auto space-y-8 py-6 md:py-12 px-4 md:px-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{t.memoryTitle}</h2>
                  <p className="text-zinc-500 text-sm mt-1">{t.memoryDesc}</p>
                </div>
                <button onClick={() => setActiveTab('chat')} className="p-3 hover:bg-white/5 rounded-2xl transition-all border border-white/5 self-end md:self-auto">
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile & Skills */}
                <div className="lg:col-span-1 space-y-6">
                  <KnowledgeGraph profile={userProfile} />
                  <div className="glass-panel rounded-3xl p-6 border-white/5 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <UserIcon className="w-8 h-8 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{t.userProfile}</h3>
                        <p className="text-xs text-zinc-500">{t.profileDesc}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">{t.discoveredSkills}</label>
                        <div className="flex flex-wrap gap-2">
                          {userProfile.skills.length === 0 ? (
                            <p className="text-xs text-zinc-600 italic">{t.noSkills}</p>
                          ) : (
                            userProfile.skills.map(skill => (
                              <span key={skill} className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase">
                                {skill}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">{t.preferences}</label>
                        <div className="space-y-2">
                          {Object.entries(userProfile.preferences).length === 0 ? (
                            <p className="text-xs text-zinc-600 italic">{t.noPreferences}</p>
                          ) : (
                            Object.entries(userProfile.preferences).map(([key, val]) => (
                              <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-xs text-zinc-400">{key}</span>
                                <span className="text-xs font-bold text-white">{String(val)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel rounded-3xl p-6 border-white/5 bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <div className="flex items-center gap-3 mb-4">
                      <SparklesIcon className="w-5 h-5 text-emerald-500" />
                      <h4 className="text-sm font-bold text-white">{t.howMemoryWorks}</h4>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {t.memoryMechanism}
                    </p>
                  </div>
                </div>

                {/* Memories List */}
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-2">{t.memoriesHistory}</h3>
                  <div className="space-y-4">
                    {userProfile.memories.length === 0 ? (
                      <div className="p-12 text-center glass-panel rounded-[40px] border-dashed border-white/5">
                        <BrainIcon className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                        <p className="text-zinc-600 text-sm">{t.memoryEmpty}</p>
                      </div>
                    ) : (
                      userProfile.memories.map(memory => (
                        <motion.div 
                          layout
                          key={memory.id} 
                          className="p-5 glass-panel rounded-3xl border-white/5 flex gap-4 items-start group hover:border-emerald-500/30 transition-all"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center shrink-0 border border-white/5 group-hover:bg-emerald-500/10 transition-colors">
                            <Database className="w-4 h-4 text-zinc-500 group-hover:text-emerald-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-300 leading-relaxed">{memory.content}</p>
                            <p className="text-[10px] text-zinc-600 mt-2 font-mono">{new Date(memory.timestamp).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                          </div>
                          <button 
                            onClick={async () => {
                              if (user) {
                                const newMemories = userProfile.memories.filter(m => m.id !== memory.id);
                                const newProfile = { ...userProfile, memories: newMemories };
                                await saveUserProfile(user.uid, newProfile);
                                setUserProfile(newProfile);
                              }
                            }}
                            className="p-2 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'history' ? (
            <div className="max-w-2xl mx-auto space-y-6 py-12">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{t.chatHistory}</h2>
                <button onClick={() => setActiveTab('chat')} className="p-2 hover:bg-white/5 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-center text-zinc-500 py-12">{t.noHistory}</p>
                ) : (
                  history.map(h => h && (
                    <button 
                      key={h.id} 
                      onClick={() => loadHistory(h)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 glass-panel rounded-xl border-white/5 hover:bg-white/10 transition-all",
                        language === 'ar' ? "text-right" : "text-left"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-white">{h.title || t.untitled}</p>
                          {h.summary && <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1 italic">"{h.summary}"</p>}
                          <p className="text-[10px] text-zinc-500 mt-1">{new Date(h.id).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                        </div>
                      </div>
                      <ArrowRight className={cn("w-4 h-4 text-zinc-600", language === 'ar' && "rotate-180")} />
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6 px-4">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-[32px] md:rounded-[40px] bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center mb-4 md:mb-8 shadow-2xl shadow-emerald-500/20 relative">
                <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse" />
                <Bot className="w-10 h-10 md:w-12 md:h-12 text-white relative z-10" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tighter mb-2 md:mb-4">{t.howCanIHelp}</h2>
              <p className="text-zinc-400 text-base md:text-xl max-w-lg leading-relaxed">
                {t.novelDesc}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full mt-4 md:mt-8">
                {[
                  { label: t.suggestion1, mode: 'Professional', original: "Create a professional CV for a Web Developer" },
                  { label: t.suggestion2, mode: 'Study', original: "Explain Quantum Physics step-by-step" },
                  { label: t.suggestion3, mode: 'Data', original: "Analyze this data and create a summary table" },
                  { label: t.suggestion4, mode: 'General', original: "Generate a high-quality futuristic landscape" }
                ].map((suggestion) => (
                  <button
                    key={suggestion.original}
                    onClick={() => { setMode(suggestion.mode as AppMode); setInput(suggestion.label); }}
                    className={cn(
                      "p-4 rounded-2xl glass-panel hover:bg-white/5 transition-all text-sm font-medium text-zinc-300 border border-white/5",
                      language === 'ar' ? "text-right" : "text-left"
                    )}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-12 px-4 md:px-6">
              {messages.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  className={cn(
                    "flex gap-3 md:gap-4",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 border",
                    msg.role === 'user' 
                      ? "bg-zinc-800 border-zinc-700" 
                      : "bg-emerald-500/10 border-emerald-500/20"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /> : <Bot className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />}
                  </div>
                  <div className={cn(
                    "flex flex-col max-w-[90%] md:max-w-[85%] space-y-2",
                    msg.role === 'user' ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "p-3 md:p-4 rounded-xl md:rounded-2xl text-sm leading-relaxed shadow-sm relative group w-full",
                      msg.role === 'user' 
                        ? "bg-emerald-600 text-white rounded-tr-none" 
                        : "glass-panel text-zinc-200 rounded-tl-none border border-white/5",
                      isTyping && idx === messages.length - 1 && msg.role === 'model' && "animate-pulse"
                    )}>
                      {msg.usedMemories && msg.usedMemories.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-3 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
                          <Brain className="w-3 h-3 text-emerald-400" />
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                            {language === 'ar' ? 'تم استخدام الذاكرة' : 'Memory Applied'}
                          </span>
                        </div>
                      )}
                      {msg.parts.map((part, pIdx) => (
                        <div key={pIdx}>
                          {part.text ? (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5 }}
                              className="markdown-body"
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                  code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                      <SyntaxHighlighter
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                        className="rounded-xl border border-white/5 my-4"
                                        {...props}
                                      >
                                        {String(children).replace(/\n$/, '')}
                                      </SyntaxHighlighter>
                                    ) : (
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    );
                                  }
                                }}
                              >
                                {part.text}
                              </ReactMarkdown>
                            </motion.div>
                          ) : msg.role === 'model' && isTyping && (
                            <div className="space-y-2 py-2">
                              <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
                              <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
                              <div className="h-4 w-2/3 bg-white/5 rounded animate-pulse" />
                            </div>
                          )}
                          
                          {part.inlineData && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="mt-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl"
                            >
                              {part.inlineData.mimeType.startsWith('image/') ? (
                                <img 
                                  src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} 
                                  alt="Attachment" 
                                  className="max-w-full h-auto"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="p-4 bg-zinc-900 flex items-center gap-3">
                                  <FileText className="w-6 h-6 text-emerald-500" />
                                  <span className="text-xs text-zinc-300">{t.documentAttached}</span>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      ))}

                      {msg.artifacts && msg.artifacts.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4 mt-4"
                        >
                          {msg.artifacts.map((artifact, aIdx) => (
                            <div key={aIdx}>
                              {artifact.type === 'table' && artifact.data?.initialData && <InteractiveTable initialData={artifact.data.initialData} />}
                              {artifact.type === 'cv' && artifact.data && <CVStudio initialData={artifact.data} />}
                              {artifact.type === 'quiz' && artifact.data && (
                                <QuizBlock 
                                  title={artifact.data.title} 
                                  questions={artifact.data.questions} 
                                  timePerQuestion={artifact.data.timePerQuestion}
                                  maxLives={artifact.data.maxLives}
                                />
                              )}
                              {artifact.type === 'chart' && artifact.data && <ChartBlock type={artifact.data.type} data={artifact.data.data} title={artifact.data.title} config={artifact.data.config} />}
                              {artifact.type === 'web' && artifact.data && <CodeSandbox html={artifact.data.html} css={artifact.data.css} js={artifact.data.js} title={artifact.data.title} />}
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {msg.type === 'image' && msg.parts.some(p => p.inlineData) && (
                        <div className="p-3 bg-zinc-900/50 border-t border-white/5 flex justify-end mt-4 rounded-b-xl">
                          <a 
                            href={`data:${msg.parts.find(p => p.inlineData)?.inlineData?.mimeType};base64,${msg.parts.find(p => p.inlineData)?.inlineData?.data}`}
                            download="nova-generated.png"
                            className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-xs"
                          >
                            <Download className="w-4 h-4" />
                            {language === 'ar' ? 'تحميل الصورة' : 'Download Image'}
                          </a>
                        </div>
                      )}
                      
                      {msg.role === 'model' && msg.parts[0].text && (
                        <button
                          onClick={() => handleSpeech(msg.parts[0].text!, idx)}
                          className={cn(
                            "absolute -right-12 top-0 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100",
                            isSpeaking === idx ? "text-emerald-500 bg-emerald-500/10" : "text-zinc-500 hover:text-white hover:bg-white/5"
                          )}
                        >
                          {isSpeaking === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                      )}
                    </div>

                    {msg.isGroundingUsed && msg.groundingUrls && msg.groundingUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.groundingUrls.slice(0, 3).map((url, uIdx) => (
                          <a
                            key={uIdx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-white/5 text-[10px] text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {new URL(url).hostname.replace('www.', '')}
                          </a>
                        ))}
                      </div>
                    )}

                    <span className="text-[10px] text-zinc-600 font-medium px-1 uppercase tracking-wider">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
              {isTyping && messages[messages.length - 1]?.role !== 'model' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                  </div>
                  <div className="glass-panel p-4 rounded-2xl rounded-tl-none border border-white/5 flex flex-col gap-3 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                      <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest ml-2">
                        {language === 'ar' ? 'جاري التفكير...' : 'Thinking...'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                          className="h-full w-1/2 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"
                        />
                      </div>
                      <div className="h-2 w-2/3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: 0.5 }}
                          className="h-full w-1/2 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-zinc-950/50 backdrop-blur-xl border-t border-white/5">
          <div className="max-w-4xl mx-auto relative">
            <AnimatePresence>
              {contextualSuggestions.length > 0 && !isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 mb-4 flex flex-wrap gap-2"
                >
                  {contextualSuggestions.map((suggestion, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => {
                        setInput(suggestion);
                        setContextualSuggestions([]);
                      }}
                      className="px-3 py-1.5 glass-panel rounded-full text-xs text-emerald-400 hover:text-white hover:bg-emerald-500/20 border border-emerald-500/30 transition-all whitespace-nowrap shadow-lg"
                    >
                      {suggestion}
                    </button>
                  ))}
                </motion.div>
              )}
              {attachment && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 mb-4 p-3 glass-panel rounded-2xl flex items-center gap-3 shadow-2xl"
                >
                  <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden">
                    {attachment.mimeType.startsWith('image/') ? (
                      <img src={`data:${attachment.mimeType};base64,${attachment.data}`} className="object-cover w-full h-full" alt="Preview" />
                    ) : (
                      <Paperclip className="w-5 h-5 text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{attachment.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{attachment.mimeType.split('/')[1]}</p>
                  </div>
                  <button onClick={() => setAttachment(null)} className="p-1.5 hover:bg-white/10 rounded-full text-zinc-400">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <form 
              onSubmit={handleSend}
              className="relative flex items-center"
            >
              <div className="absolute left-2 md:left-4 flex items-center gap-1 md:gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setInput(prev => prev + " Generate an image of ")}
                  className="hidden md:flex p-2 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/5 rounded-xl transition-all"
                  title="Generate image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,application/pdf,text/*,.xlsx,.csv"
              />

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`${t.messagePlaceholder} [${mode}]...`}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-3 md:py-4 pl-12 md:pl-28 pr-14 md:pr-16 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm md:text-base text-zinc-100 placeholder-zinc-500 transition-all shadow-inner"
              />

              <button
                type="submit"
                disabled={(!input.trim() && !attachment) || isTyping}
                className={cn(
                  "absolute right-2 md:right-3 p-2 md:p-2.5 rounded-xl transition-all shadow-lg",
                  (!input.trim() && !attachment) || isTyping
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-emerald-500 text-white hover:bg-emerald-400 hover:scale-105 active:scale-95"
                )}
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </form>
          </div>
        </div>
        <AnimatePresence>
          {showSubscription && (
            <SubscriptionManager onClose={() => setShowSubscription(false)} />
          )}
        </AnimatePresence>
        <LiveVoiceChat 
          isOpen={isLiveVoiceOpen} 
          onClose={() => setIsLiveVoiceOpen(false)} 
        />
        <AnimatePresence>
          {showPersonaBuilder && (
            <PersonaBuilder 
              onClose={() => setShowPersonaBuilder(false)} 
              onSave={(p) => { setCustomPersona(p); setShowPersonaBuilder(false); }}
              initialPersona={customPersona}
              language={language}
            />
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettings(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md glass-panel p-8 rounded-[32px] border border-white/10 shadow-2xl space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Settings className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">{t.settings}</h2>
                  </div>
                  <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/5 rounded-full text-zinc-400">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Language Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">{t.language}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setLanguage('ar')}
                        className={cn(
                          "py-3 rounded-xl border transition-all font-bold text-sm",
                          language === 'ar' ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                        )}
                      >
                        {t.arabic}
                      </button>
                      <button
                        onClick={() => setLanguage('en')}
                        className={cn(
                          "py-3 rounded-xl border transition-all font-bold text-sm",
                          language === 'en' ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                        )}
                      >
                        {t.english}
                      </button>
                    </div>
                  </div>

                  {/* Typing Sound Toggle */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">
                      {language === 'ar' ? 'صوت الكتابة' : 'Typing Sound'}
                    </label>
                    <button
                      onClick={() => setTypingSoundEnabled(!typingSoundEnabled)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all font-medium",
                        typingSoundEnabled ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-5 h-5" />
                        <span>{language === 'ar' ? 'تفعيل صوت الكتابة' : 'Enable Typing Sound'}</span>
                      </div>
                      <div className={cn(
                        "w-10 h-5 rounded-full relative transition-all",
                        typingSoundEnabled ? "bg-emerald-500" : "bg-zinc-700"
                      )}>
                        <div className={cn(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                          typingSoundEnabled ? "right-1" : "left-1"
                        )} />
                      </div>
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => { setShowPersonaBuilder(true); setShowSettings(false); }}
                      className="flex items-center gap-3 w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-zinc-300 font-medium"
                    >
                      <SparklesIcon className="w-5 h-5 text-emerald-500" />
                      {t.customizePersona}
                    </button>
                    <button
                      onClick={() => { handleResetBlacklist(); setShowSettings(false); }}
                      className="flex items-center gap-3 w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-zinc-300 font-medium"
                    >
                      <Database className="w-5 h-5 text-blue-500" />
                      {t.resetBlacklist}
                    </button>
                    <button
                      onClick={() => { handleClearHistory(); setShowSettings(false); }}
                      className="flex items-center gap-3 w-full p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all text-red-400 font-medium"
                    >
                      <Trash2 className="w-5 h-5" />
                      {t.clearHistory}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsLiveVoiceOpen(true)}
          className="fixed bottom-24 right-6 p-4 bg-emerald-500 text-white rounded-full shadow-2xl hover:bg-emerald-400 hover:scale-110 transition-all z-40 group"
          title="Voice Mode"
        >
          <Mic className="w-6 h-6" />
          <span className="absolute right-full mr-3 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {language === 'ar' ? 'الوضع الصوتي المباشر' : 'Live Voice Mode'}
          </span>
        </button>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <NovelApp />
    </ErrorBoundary>
  );
}
