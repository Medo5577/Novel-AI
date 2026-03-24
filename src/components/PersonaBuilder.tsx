import React, { useState } from 'react';
import { Sparkles, Brain, Zap, Shield, X, Save, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface PersonaBuilderProps {
  onSave: (persona: any) => void;
  onClose: () => void;
  initialPersona?: any;
  language: 'ar' | 'en';
}

export const PersonaBuilder: React.FC<PersonaBuilderProps> = ({ onSave, onClose, initialPersona, language }) => {
  const [persona, setPersona] = useState(initialPersona || {
    creativity: 50,
    professionalism: 50,
    speed: 50,
    safety: 80,
    tone: 'Helpful',
    language: language === 'ar' ? 'Arabic' : 'English'
  });

  const t = {
    ar: {
      title: "تخصيص شخصية Novel",
      desc: "قم بتعديل سلوك الذكاء الاصطناعي ليناسب احتياجاتك.",
      creativity: "الإبداع",
      professionalism: "الاحترافية",
      speed: "السرعة",
      safety: "الأمان",
      tone: "نبرة الصوت المفضلة",
      save: "حفظ الإعدادات",
      reset: "إعادة ضبط",
      tones: {
        Helpful: "مساعد",
        Friendly: "ودود",
        Strict: "صارم",
        Funny: "مرح",
        Minimalist: "مختصر"
      }
    },
    en: {
      title: "Customize Novel Persona",
      desc: "Adjust the AI's behavior to suit your needs.",
      creativity: "Creativity",
      professionalism: "Professionalism",
      speed: "Speed",
      safety: "Safety",
      tone: "Preferred Tone",
      save: "Save Settings",
      reset: "Reset",
      tones: {
        Helpful: "Helpful",
        Friendly: "Friendly",
        Strict: "Strict",
        Funny: "Funny",
        Minimalist: "Minimalist"
      }
    }
  }[language];

  const traits = [
    { id: 'creativity', label: t.creativity, icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'professionalism', label: t.professionalism, icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'speed', label: t.speed, icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { id: 'safety', label: t.safety, icon: Brain, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-xl glass-panel rounded-[32px] md:rounded-[40px] border-white/10 overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
        <div className="p-4 md:p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-br from-emerald-500/10 to-transparent shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">{t.title}</h2>
              <p className="text-zinc-500 text-[10px] md:text-sm">{t.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 md:p-3 hover:bg-white/5 rounded-xl md:rounded-2xl transition-all">
            <X className="w-5 h-5 md:w-6 md:h-6 text-zinc-500" />
          </button>
        </div>

        <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {traits.map((trait) => (
              <div key={trait.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${trait.bg}`}>
                      <trait.icon className={`w-4 h-4 ${trait.color}`} />
                    </div>
                    <span className="text-sm font-bold text-zinc-300">{trait.label}</span>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">{persona[trait.id]}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={persona[trait.id]}
                  onChange={(e) => setPersona({ ...persona, [trait.id]: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block px-1">{t.tone}</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(t.tones).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPersona({ ...persona, tone: key })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${persona.tone === key ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button 
              onClick={() => onSave(persona)}
              className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> {t.save}
            </button>
            <button 
              onClick={() => setPersona({ creativity: 50, professionalism: 50, speed: 50, safety: 80, tone: 'Helpful', language: language === 'ar' ? 'Arabic' : 'English' })}
              className="p-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-2xl transition-all"
              title={t.reset}
            >
              <RefreshCw className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
