import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, RotateCcw, Timer, Trophy, Zap, AlertCircle, Heart, HeartOff, Info, ListChecks } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizBlockProps {
  title: string;
  questions: Question[];
  timePerQuestion?: number;
  maxLives?: number;
}

export const QuizBlock: React.FC<QuizBlockProps> = ({ title, questions, timePerQuestion = 15, maxLives = 3 }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [shake, setShake] = useState(false);
  const [lives, setLives] = useState(maxLives);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));

  const handleNext = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
      setTimeLeft(timePerQuestion);
      setIsTimeUp(false);
    } else {
      setIsFinished(true);
    }
  }, [currentIdx, questions.length, timePerQuestion]);

  useEffect(() => {
    if (isFinished || showResult || isTimeUp || isGameOver) return;

    if (timeLeft <= 0) {
      setIsTimeUp(true);
      setShowResult(true);
      setStreak(0);
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) setIsGameOver(true);
        return newLives;
      });
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished, showResult, isTimeUp, isGameOver]);

  const handleOptionSelect = (idx: number) => {
    if (showResult || isTimeUp || isGameOver) return;
    
    setSelectedOption(idx);
    setShowResult(true);
    
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentIdx] = idx;
    setUserAnswers(newUserAnswers);
    
    const isCorrect = idx === questions[currentIdx].correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > bestStreak) setBestStreak(newStreak);
        return newStreak;
      });
    } else {
      setStreak(0);
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) setIsGameOver(true);
        return newLives;
      });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const resetQuiz = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setShowResult(false);
    setScore(0);
    setIsFinished(false);
    setTimeLeft(timePerQuestion);
    setStreak(0);
    setBestStreak(0);
    setIsTimeUp(false);
    setLives(maxLives);
    setIsGameOver(false);
    setShowReview(false);
    setUserAnswers(new Array(questions.length).fill(null));
  };

  const progress = ((currentIdx + (showResult ? 1 : 0)) / questions.length) * 100;

  if (isGameOver || isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    
    if (showReview) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 md:p-8 my-8 shadow-2xl backdrop-blur-xl max-h-[80vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-zinc-900/80 backdrop-blur-md p-4 -m-4 z-10 border-b border-white/5">
            <h3 className="text-2xl font-bold text-white">مراجعة الإجابات</h3>
            <button 
              onClick={() => setShowReview(false)}
              className="p-2 hover:bg-white/10 rounded-full text-zinc-400 transition-colors"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          <div className="space-y-6" dir="rtl">
            {questions.map((q, idx) => (
              <div key={idx} className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-zinc-400">
                    {idx + 1}
                  </span>
                  <h4 className="text-lg font-bold text-white">{q.question}</h4>
                </div>
                <div className="space-y-2 mb-4">
                  {q.options.map((opt, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "p-3 rounded-xl border text-sm flex items-center justify-between",
                        i === q.correctAnswer ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" :
                        i === userAnswers[idx] ? "bg-red-500/20 border-red-500/50 text-red-400" :
                        "bg-white/5 border-white/5 text-zinc-500"
                      )}
                    >
                      <span>{opt}</span>
                      {i === q.correctAnswer && <CheckCircle2 size={16} />}
                      {i === userAnswers[idx] && i !== q.correctAnswer && <XCircle size={16} />}
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl text-xs text-blue-300">
                  <span className="font-bold block mb-1">التفسير:</span>
                  {q.explanation}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setShowReview(false)}
            className="w-full mt-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all"
          >
            العودة للملخص
          </button>
        </motion.div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 text-center my-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="relative w-24 h-24 mx-auto mb-6">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className={cn(
              "w-full h-full rounded-full flex items-center justify-center",
              isGameOver ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
            )}
          >
            {isGameOver ? <HeartOff size={48} /> : <Trophy size={48} />}
          </motion.div>
          {!isGameOver && percentage === 100 && (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 border-2 border-dashed border-emerald-500/30 rounded-full"
            />
          )}
        </div>
        
        <h3 className="text-3xl font-bold text-white mb-2">
          {isGameOver ? 'انتهت المحاولات!' : 'اكتمل الاختبار!'}
        </h3>
        <p className="text-zinc-400 mb-8">
          {isGameOver ? 'لقد فقدت كل قلوبك. حاول مرة أخرى لتحسين مستواك.' : `لقد حصلت على ${score} من أصل ${questions.length} (${percentage}%)`}
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">أفضل سلسلة</div>
            <div className="text-2xl font-bold text-orange-400 flex items-center justify-center gap-2">
              <Zap size={20} /> {bestStreak}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">المستوى</div>
            <div className="text-2xl font-bold text-blue-400">
              {isGameOver ? 'غير مكتمل' : percentage >= 90 ? 'خبير' : percentage >= 70 ? 'متقدم' : percentage >= 50 ? 'متوسط' : 'مبتدئ'}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={resetQuiz} 
            className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            <RotateCcw size={20} /> إعادة المحاولة
          </button>
          <button 
            onClick={() => setShowReview(true)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10"
          >
            <ListChecks size={20} /> مراجعة الإجابات
          </button>
        </div>
      </motion.div>
    );
  }

  const current = questions[currentIdx];

  return (
    <motion.div 
      animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="bg-zinc-900/50 border border-white/10 rounded-3xl overflow-hidden my-8 shadow-2xl backdrop-blur-xl"
    >
      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
        />
      </div>

      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
              <HelpCircle size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-sm uppercase tracking-widest">{title}</h3>
                <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[8px] font-black rounded border border-red-500/20 uppercase tracking-tighter">
                  وضع صارم
                </span>
              </div>
              <div className="text-zinc-500 text-[10px] font-medium">السؤال {currentIdx + 1} من {questions.length}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[...Array(maxLives)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{ scale: i < lives ? 1 : 0.8, opacity: i < lives ? 1 : 0.3 }}
                >
                  <Heart 
                    size={18} 
                    className={i < lives ? "text-red-500 fill-red-500" : "text-zinc-600"} 
                  />
                </motion.div>
              ))}
            </div>
            
            {streak > 1 && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-bold border border-orange-500/30"
              >
                <Zap size={14} fill="currentColor" /> {streak}
              </motion.div>
            )}
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl border transition-colors",
              timeLeft <= 5 ? "bg-red-500/20 border-red-500/30 text-red-400 animate-pulse" : "bg-white/5 border-white/10 text-zinc-400"
            )}>
              <Timer size={18} />
              <span className="font-mono font-bold text-lg">{timeLeft}s</span>
            </div>
          </div>
        </div>

        <h4 className="text-xl md:text-2xl font-bold text-white mb-8 leading-tight text-right" dir="rtl">
          {current.question}
        </h4>

        <div className="space-y-3 mb-8" dir="rtl">
          {current.options.map((option, i) => {
            const isCorrect = i === current.correctAnswer;
            const isSelected = i === selectedOption;
            
            let stateClass = "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:border-white/20 hover:text-white";
            
            if (showResult || isTimeUp) {
              if (isCorrect) {
                stateClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 ring-2 ring-emerald-500/20";
              } else if (isSelected) {
                stateClass = "bg-red-500/20 border-red-500/50 text-red-400 ring-2 ring-red-500/20";
              } else {
                stateClass = "bg-white/5 border-white/5 text-zinc-600 opacity-50";
              }
            }

            return (
              <motion.button
                key={i}
                whileHover={!(showResult || isTimeUp) ? { x: -4 } : {}}
                whileTap={!(showResult || isTimeUp) ? { scale: 0.98 } : {}}
                onClick={() => handleOptionSelect(i)}
                disabled={showResult || isTimeUp}
                className={cn(
                  "w-full text-right p-5 rounded-2xl border transition-all flex items-center justify-between group relative overflow-hidden",
                  stateClass
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold border border-white/10 group-hover:bg-white/10 transition-colors">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-medium text-lg">{option}</span>
                </div>
                
                <AnimatePresence>
                  {showResult && isCorrect && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-400">
                      <CheckCircle2 size={24} />
                    </motion.div>
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-red-400">
                      <XCircle size={24} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {(showResult || isTimeUp) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {isTimeUp && !selectedOption && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 mb-4">
                  <AlertCircle size={20} />
                  <span className="font-bold">انتهى الوقت!</span>
                </div>
              )}

              <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
                <div className="relative">
                  <div className="flex items-center gap-2 text-blue-400 mb-2 font-bold text-sm uppercase tracking-wider">
                    <Info size={16} /> التفسير
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-right" dir="rtl">
                    {current.explanation}
                  </p>
                </div>
              </div>

              <button 
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-3 py-5 bg-white text-black hover:bg-zinc-200 font-black rounded-2xl transition-all active:scale-95 shadow-xl shadow-white/5"
              >
                {currentIdx === questions.length - 1 ? 'إنهاء الاختبار' : 'السؤال التالي'} 
                <ArrowRight size={22} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
