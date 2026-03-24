import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, Palette, Code, Shield, ArrowRight, Globe, BarChart3, FileText, GraduationCap, Briefcase, Mail, Lock, User as UserIcon } from 'lucide-react';
import { cn } from '../utils';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  onEmailLogin: (email: string, pass: string) => Promise<void>;
  onEmailRegister: (email: string, pass: string) => Promise<void>;
  language: 'ar' | 'en';
  isLoggedIn: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin, onEmailLogin, onEmailRegister, language, isLoggedIn }) => {
  const [showEmailForm, setShowEmailForm] = React.useState(false);
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const t = {
    ar: {
      capabilities: "القدرات",
      about: "عن نوفا",
      startNow: "ابدأ الآن",
      login: "تسجيل الدخول",
      heroTitle: "قوة الذكاء الاصطناعي <br /> في متناول يدك",
      heroDesc: "استكشف قوة Novel AI، وكيل الذكاء الاصطناعي المتقدم الذي يمكنه التفكير والتحليل والإبداع مثل البشر. احصل على حلول ذكية لجميع احتياجاتك من البحث في الإنترنت إلى توليد الصور وكتابة الأكواد.",
      startFree: "ابدأ الآن مجانًا",
      loginGoogle: "تسجيل الدخول بجوجل",
      loginEmail: "تسجيل الدخول بالبريد",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      submitLogin: "دخول",
      submitRegister: "إنشاء حساب",
      toggleRegister: "ليس لديك حساب؟ سجل الآن",
      toggleLogin: "لديك حساب بالفعل؟ سجل دخولك",
      discover: "اكتشف القدرات",
      featuresTitle: "عالم من الإمكانيات بين يديك",
      featuresDesc: "Novel AI ليس مجرد مساعد، بل هو شريكك الإبداعي والتحليلي المتكامل.",
      feat1Title: "الإنتاجية والتحليل",
      feat1Desc: "تحليل البيانات، إنشاء التقارير، وإدارة الجداول الذكية.",
      feat2Title: "الإبداع الفني",
      feat2Desc: "توليد صور فنية مذهلة من وصفك فقط",
      feat3Title: "البرمجة والمطورين",
      feat3Desc: "كتابة وتصحيح الأكواد بجميع اللغات",
      feat4Title: "القدرات المتقدمة",
      feat4Desc: "تفكير منطقي وحل مشكلات معقدة",
      detail1Badge: "تحليل جميع أنواع الملفات",
      detail1Title: "تحليل واستخلاص البيانات من ملفات PDF، جداول Excel، وملفات نصية.",
      detail1Desc: "قم بتلخيص المستندات الطويلة، استخراج الأرقام الرئيسية، أو طرح أسئلة حول محتوى مستنداتك. Novel يفهم السياق بدقة متناهية.",
      detail2Badge: "إنشاء السير الذاتية الاحترافية",
      detail2Title: "صمم سيرتك الذاتية (CV) بلمسة واحدة. استخدم أمر /resume لوصف خبراتك.",
      detail2Desc: "سيقوم Novel AI بإنشاء سيرة ذاتية احترافية بتنسيق ATS مع إمكانية التعديل المباشر واختيار التصميم.",
      detail3Badge: "تحويل البيانات إلى رؤى",
      detail3Title: "حوّل الأرقام المعقدة إلى جداول تفاعلية ورسوم بيانية جذابة.",
      detail3Desc: "يمكنك التعديل على الجداول مباشرة، إضافة صفوف، وتصديرها كملفات CSV بسهولة. اجعل بياناتك تتحدث.",
      detail4Badge: "وضع المذاكرة التفاعلي",
      detail4Title: "رفيقك المثالي للدراسة. شرح مبسط للمفاهيم المعقدة.",
      detail4Desc: "حل المعادلات الرياضية والكيميائية بتنسيق LaTeX، وإنشاء اختبارات تفاعلية لتقييم مستواك. المذاكرة أصبحت أمتع وأكثر فعالية.",
      aboutTitle: "قصتنا: رؤية خلف Novel AI",
      aboutP1: "Novel AI هو أكثر من مجرد برنامج، إنه نتاج رؤية وشغف. تم تطويره بالكامل بواسطة <span class=\"text-white font-bold\">محمد إبراهيم عبدالله</span>، مهندس برمجيات متخصص في الذكاء الاصطناعي، بهدف جعل التقنيات المتقدمة سهلة الوصول ومفيدة للجميع في العالم العربي.",
      aboutP2: "بدأت الفكرة من إيمان محمد بأن الذكاء الاصطناعي يجب أن يكون أداة تمكينية، شريكًا إبداعيًا، ومساعدًا ذكيًا يكسر حواجز اللغة والتقنية. كل سطر من الكود، وكل ميزة في Novel AI، تم تصميمها بعناية لتكون قوية وبديهية في آن واحد.",
      aboutP3: "مهمتنا هي أن نقدم لك الأدوات التي تحتاجها لتحويل أفكارك إلى واقع، سواء كنت طالبًا يسعى للمعرفة، أو محترفًا يهدف لزيادة إنتاجيته، أو مبدعًا يبحث عن إلهام. Novel AI هو رفيقك في رحلة الابتكار.",
      founder: "Founder & Lead Engineer",
      rights: "جميع الحقوق محفوظة.",
      tagline: "Intelligence Redefined"
    },
    en: {
      capabilities: "Capabilities",
      about: "About Novel",
      startNow: "Start Now",
      login: "Login",
      heroTitle: "AI Power <br /> at Your Fingertips",
      heroDesc: "Explore the power of Novel AI, an advanced AI agent that can think, analyze, and create like a human. Get smart solutions for all your needs from web search to image generation and coding.",
      startFree: "Start Now for Free",
      loginGoogle: "Login with Google",
      loginEmail: "Login with Email",
      email: "Email Address",
      password: "Password",
      submitLogin: "Login",
      submitRegister: "Register",
      toggleRegister: "Don't have an account? Register",
      toggleLogin: "Already have an account? Login",
      discover: "Discover Capabilities",
      featuresTitle: "A World of Possibilities",
      featuresDesc: "Novel AI is not just an assistant, it's your integrated creative and analytical partner.",
      feat1Title: "Productivity & Analysis",
      feat1Desc: "Data analysis, report generation, and smart table management.",
      feat2Title: "Artistic Creativity",
      feat2Desc: "Generate stunning artistic images from your description only.",
      feat3Title: "Coding & Developers",
      feat3Desc: "Write and debug code in all languages.",
      feat4Title: "Advanced Capabilities",
      feat4Desc: "Logical thinking and complex problem solving.",
      detail1Badge: "Analyze All File Types",
      detail1Title: "Analyze and extract data from PDFs, Excel sheets, and text files.",
      detail1Desc: "Summarize long documents, extract key figures, or ask questions about your document content. Novel understands context with extreme precision.",
      detail2Badge: "Professional CV Creation",
      detail2Title: "Design your CV with one touch. Use the /resume command to describe your experiences.",
      detail2Desc: "Novel AI will create a professional ATS-formatted CV with direct editing and design choice options.",
      detail3Badge: "Transform Data into Insights",
      detail3Title: "Turn complex numbers into interactive tables and attractive charts.",
      detail3Desc: "You can edit tables directly, add rows, and export them as CSV files easily. Make your data talk.",
      detail4Badge: "Interactive Study Mode",
      detail4Title: "Your perfect study companion. Simplified explanation of complex concepts.",
      detail4Desc: "Solve mathematical and chemical equations in LaTeX format, and create interactive tests to evaluate your level. Studying has become more fun and effective.",
      aboutTitle: "Our Story: The Vision Behind Novel AI",
      aboutP1: "Novel AI is more than just software; it's the product of vision and passion. It was fully developed by <span class=\"text-white font-bold\">Mohammed Ibrahim Abdullah</span>, a software engineer specializing in AI, with the goal of making advanced technologies accessible and useful for everyone in the Arab world.",
      aboutP2: "The idea started from Mohammed's belief that AI should be an empowering tool, a creative partner, and a smart assistant that breaks language and technical barriers. Every line of code, and every feature in Novel AI, was carefully designed to be both powerful and intuitive.",
      aboutP3: "Our mission is to provide you with the tools you need to turn your ideas into reality, whether you're a student seeking knowledge, a professional aiming to increase productivity, or a creator looking for inspiration. Novel AI is your companion in the journey of innovation.",
      founder: "Founder & Lead Engineer",
      rights: "All rights reserved.",
      tagline: "Intelligence Redefined"
    }
  }[language];

  return (
    <div className={cn("min-h-screen bg-zinc-950 text-white selection:bg-emerald-500/30 font-sans overflow-x-hidden", language === 'ar' ? "rtl" : "ltr")}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="relative">
              <motion.div 
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-3 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-80 transition duration-1000"
              />
              <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-emerald-400 group-hover:text-white transition-all duration-500 group-hover:scale-110" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl md:text-4xl font-black tracking-tighter bg-gradient-to-r from-white via-emerald-400 to-blue-500 bg-clip-text text-transparent leading-none drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                Novel AI
              </span>
              <span className="text-[9px] md:text-[11px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-1.5 opacity-70 group-hover:opacity-100 transition-opacity">{t.tagline}</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">{t.capabilities}</a>
            <a href="#about" className="hover:text-white transition-colors">{t.about}</a>
            {!isLoggedIn && (
              <button 
                onClick={onLogin}
                className="hover:text-white transition-colors"
              >
                {t.login}
              </button>
            )}
            <button 
              onClick={isLoggedIn ? onStart : onLogin}
              className="px-6 py-2.5 bg-white text-black rounded-full hover:bg-zinc-200 transition-all font-bold"
            >
              {t.startNow}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-20">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 
              className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent leading-tight"
              dangerouslySetInnerHTML={{ __html: t.heroTitle }}
            />
            <p className="text-xl md:text-2xl text-zinc-400 mb-12 leading-relaxed max-w-3xl mx-auto">
              {t.heroDesc}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={isLoggedIn ? onStart : onLogin}
                className="w-full sm:w-auto px-10 py-5 bg-emerald-500 text-white rounded-2xl font-bold text-lg hover:bg-emerald-400 hover:scale-105 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {t.startFree} <ArrowRight className={cn("w-5 h-5", language === 'ar' && "rotate-180")} />
              </button>
            {!isLoggedIn && (
              <div className="flex flex-col gap-4 w-full max-w-sm">
                {!showEmailForm ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={onLogin}
                      className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      {t.loginGoogle}
                    </button>
                    <button 
                      onClick={() => setShowEmailForm(true)}
                      className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Mail className="w-5 h-5" /> {t.loginEmail}
                    </button>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 p-8 rounded-3xl w-full"
                  >
                    <h3 className="text-xl font-bold text-white mb-6 text-center">
                      {isRegistering ? t.submitRegister : t.submitLogin}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1.5">{t.email}</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                          <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-emerald-500 transition-colors outline-none"
                            placeholder="name@example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1.5">{t.password}</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                          <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-emerald-500 transition-colors outline-none"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                      <button 
                        disabled={loading}
                        onClick={async () => {
                          setLoading(true);
                          setError('');
                          try {
                            if (isRegistering) {
                              await onEmailRegister(email, password);
                            } else {
                              await onEmailLogin(email, password);
                            }
                          } catch (err: any) {
                            setError(err.message);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-400 transition-all disabled:opacity-50"
                      >
                        {loading ? '...' : (isRegistering ? t.submitRegister : t.submitLogin)}
                      </button>
                      <div className="flex flex-col gap-2 pt-2">
                        <button 
                          onClick={() => setIsRegistering(!isRegistering)}
                          className="text-sm text-zinc-400 hover:text-white transition-colors text-center"
                        >
                          {isRegistering ? t.toggleLogin : t.toggleRegister}
                        </button>
                        <button 
                          onClick={() => setShowEmailForm(false)}
                          className="text-sm text-zinc-500 hover:text-white transition-colors text-center"
                        >
                          {language === 'ar' ? 'رجوع' : 'Back'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
              <a 
                href="#features"
                className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all"
              >
                {t.discover}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">{t.featuresTitle}</h2>
            <p className="text-zinc-400 text-lg">{t.featuresDesc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: t.feat1Title, desc: t.feat1Desc },
              { icon: Palette, title: t.feat2Title, desc: t.feat2Desc },
              { icon: Code, title: t.feat3Title, desc: t.feat3Desc },
              { icon: Shield, title: t.feat4Title, desc: t.feat4Desc }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Features */}
      <section className="py-32 px-6 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto space-y-32">
          {/* Feature 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
                <FileText className="w-4 h-4" /> {t.detail1Badge}
              </div>
              <h3 className="text-4xl font-bold leading-tight">{t.detail1Title}</h3>
              <p className="text-zinc-400 text-lg leading-relaxed">
                {t.detail1Desc}
              </p>
            </div>
            <div className="relative group">
              <div className="absolute -inset-4 bg-emerald-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative rounded-3xl border border-white/10 bg-zinc-900 p-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="h-4 w-3/4 bg-white/10 rounded-full" />
                  <div className="h-4 w-full bg-white/5 rounded-full" />
                  <div className="h-4 w-2/3 bg-white/10 rounded-full" />
                  <div className="mt-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-emerald-400 text-sm font-mono">Summary: The quarterly report shows a 24% growth in user retention...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative group">
              <div className="absolute -inset-4 bg-blue-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative rounded-3xl border border-white/10 bg-zinc-900 p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20" />
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-white/20 rounded-full" />
                    <div className="h-2 w-16 bg-white/10 rounded-full" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-full bg-white/5 rounded-full" />
                  <div className="h-2 w-full bg-white/5 rounded-full" />
                  <div className="h-2 w-3/4 bg-white/5 rounded-full" />
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold">
                <Briefcase className="w-4 h-4" /> {t.detail2Badge}
              </div>
              <h3 className="text-4xl font-bold leading-tight">{t.detail2Title}</h3>
              <p className="text-zinc-400 text-lg leading-relaxed">
                {t.detail2Desc}
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-bold">
                <BarChart3 className="w-4 h-4" /> {t.detail3Badge}
              </div>
              <h3 className="text-4xl font-bold leading-tight">{t.detail3Title}</h3>
              <p className="text-zinc-400 text-lg leading-relaxed">
                {t.detail3Desc}
              </p>
            </div>
            <div className="relative group">
              <div className="h-64 rounded-3xl border border-white/10 bg-zinc-900 p-8 flex items-end gap-2">
                <div className="flex-1 bg-emerald-500/40 rounded-t-lg h-1/2" />
                <div className="flex-1 bg-emerald-500/60 rounded-t-lg h-3/4" />
                <div className="flex-1 bg-emerald-500 rounded-t-lg h-full" />
                <div className="flex-1 bg-emerald-500/80 rounded-t-lg h-2/3" />
              </div>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative group">
              <div className="relative rounded-3xl border border-white/10 bg-zinc-900 p-8 shadow-2xl text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-sm font-bold">Question 1: What is AI?</p>
                <div className="mt-4 space-y-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">Correct Answer</div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-xs">Option B</div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
                <GraduationCap className="w-4 h-4" /> {t.detail4Badge}
              </div>
              <h3 className="text-4xl font-bold leading-tight">{t.detail4Title}</h3>
              <p className="text-zinc-400 text-lg leading-relaxed">
                {t.detail4Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-12 rounded-[40px] bg-gradient-to-br from-zinc-900 to-black border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px]" />
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl font-bold">{t.aboutTitle}</h2>
              <div className="space-y-6 text-zinc-400 text-lg leading-relaxed">
                <p dangerouslySetInnerHTML={{ __html: t.aboutP1 }} />
                <p dangerouslySetInnerHTML={{ __html: t.aboutP2 }} />
                <p dangerouslySetInnerHTML={{ __html: t.aboutP3 }} />
              </div>
              <div className="pt-8 border-t border-white/10">
                <p className="text-xl font-bold">Mohammed Ibrahim Abdullah</p>
                <p className="text-zinc-500 text-sm">{t.founder}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          <span className="font-black tracking-tighter text-xl bg-gradient-to-r from-white to-emerald-500 bg-clip-text text-transparent">Novel AI</span>
        </div>
        <p className="text-zinc-500 text-sm">© 2026 Novel AI. {t.rights}</p>
      </footer>
    </div>
  );
};
