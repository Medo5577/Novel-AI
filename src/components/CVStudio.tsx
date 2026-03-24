import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, GraduationCap, Award, Palette, Download, Camera } from 'lucide-react';
import { motion } from 'motion/react';

interface CVData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: { company: string; role: string; period: string; description: string }[];
  education: { school: string; degree: string; period: string }[];
  skills: string[];
  photo?: string;
}

interface CVStudioProps {
  initialData: CVData;
}

type DesignTheme = 'modern' | 'classic' | 'minimal' | 'creative';

export const CVStudio: React.FC<CVStudioProps> = ({ initialData }) => {
  const [cv, setCv] = useState<CVData>(initialData);
  const [theme, setTheme] = useState<DesignTheme>('modern');
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = (field: keyof CVData, value: any) => {
    setCv(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdate('photo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const themes: { id: DesignTheme; name: string; color: string }[] = [
    { id: 'modern', name: 'Modern Blue', color: 'bg-blue-600' },
    { id: 'classic', name: 'Classic Dark', color: 'bg-slate-800' },
    { id: 'minimal', name: 'Minimalist', color: 'bg-white border border-black/10' },
    { id: 'creative', name: 'Creative Emerald', color: 'bg-emerald-600' },
  ];

  const renderPreview = () => {
    const themeClasses = {
      modern: "bg-white text-slate-900",
      classic: "bg-[#f8f9fa] text-slate-900",
      minimal: "bg-white text-black",
      creative: "bg-slate-50 text-slate-900"
    };

    const accentClasses = {
      modern: "bg-blue-600 text-white",
      classic: "bg-slate-800 text-white",
      minimal: "bg-black text-white",
      creative: "bg-emerald-600 text-white"
    };

    return (
      <div className={`w-full max-w-4xl mx-auto shadow-2xl rounded-lg overflow-hidden ${themeClasses[theme]} min-h-[800px] p-8 font-sans`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-12">
          <div className="relative group">
            <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg ${accentClasses[theme]}`}>
              {cv.photo ? (
                <img src={cv.photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={64} className="opacity-50" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform">
              <Camera size={16} className="text-slate-600" />
              <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
            </label>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold tracking-tight mb-2">{cv.name}</h1>
            <p className={`text-xl font-medium mb-4 opacity-80`}>{cv.title}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm opacity-70">
              <span className="flex items-center gap-1"><Mail size={14} /> {cv.email}</span>
              <span className="flex items-center gap-1"><Phone size={14} /> {cv.phone}</span>
              <span className="flex items-center gap-1"><MapPin size={14} /> {cv.location}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-8">
            <section>
              <h2 className={`text-lg font-bold uppercase tracking-wider mb-4 border-b-2 pb-1 inline-block`}>Professional Summary</h2>
              <p className="leading-relaxed opacity-90">{cv.summary}</p>
            </section>

            <section>
              <h2 className={`text-lg font-bold uppercase tracking-wider mb-4 border-b-2 pb-1 inline-block`}>Experience</h2>
              <div className="space-y-6">
                {cv.experience.map((exp, i) => (
                  <div key={i} className="relative pl-4 border-l-2 border-slate-200">
                    <h3 className="font-bold text-lg">{exp.role}</h3>
                    <div className="flex justify-between text-sm opacity-70 mb-2">
                      <span className="font-medium">{exp.company}</span>
                      <span>{exp.period}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <section>
              <h2 className={`text-lg font-bold uppercase tracking-wider mb-4 border-b-2 pb-1 inline-block`}>Skills</h2>
              <div className="flex flex-wrap gap-2">
                {cv.skills.map((skill, i) => (
                  <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${accentClasses[theme]}`}>
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h2 className={`text-lg font-bold uppercase tracking-wider mb-4 border-b-2 pb-1 inline-block`}>Education</h2>
              <div className="space-y-4">
                {cv.education.map((edu, i) => (
                  <div key={i}>
                    <h3 className="font-bold text-sm">{edu.degree}</h3>
                    <p className="text-xs opacity-70">{edu.school}</p>
                    <p className="text-[10px] opacity-50">{edu.period}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 my-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
            <Briefcase size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">CV Studio</h2>
            <p className="text-sm text-white/50">Design and edit your professional profile</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isEditing ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
          >
            {isEditing ? 'Preview' : 'Edit Content'}
          </button>
          <button className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/70 transition-colors">
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        {themes.map(t => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${theme === t.id ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/10 text-white/50 hover:border-white/20'}`}
          >
            <div className={`w-4 h-4 rounded-full ${t.color}`} />
            {t.name}
          </button>
        ))}
      </div>

      <div className="relative">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-black/20 rounded-xl">
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs text-white/40 uppercase mb-1 block">Full Name</span>
                <input 
                  type="text" 
                  value={cv.name} 
                  onChange={e => handleUpdate('name', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                />
              </label>
              <label className="block">
                <span className="text-xs text-white/40 uppercase mb-1 block">Professional Title</span>
                <input 
                  type="text" 
                  value={cv.title} 
                  onChange={e => handleUpdate('title', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs text-white/40 uppercase mb-1 block">Email</span>
                  <input 
                    type="email" 
                    value={cv.email} 
                    onChange={e => handleUpdate('email', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-white/40 uppercase mb-1 block">Phone</span>
                  <input 
                    type="text" 
                    value={cv.phone} 
                    onChange={e => handleUpdate('phone', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs text-white/40 uppercase mb-1 block">Summary</span>
                <textarea 
                  value={cv.summary} 
                  onChange={e => handleUpdate('summary', e.target.value)}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500 resize-none"
                />
              </label>
            </div>
            <div className="space-y-4">
               <label className="block">
                <span className="text-xs text-white/40 uppercase mb-1 block">Skills (comma separated)</span>
                <input 
                  type="text" 
                  value={cv.skills.join(', ')} 
                  onChange={e => handleUpdate('skills', e.target.value.split(',').map(s => s.trim()))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                />
              </label>
              {/* Simplified experience/education for brevity in this UI block */}
              <p className="text-xs text-white/30 italic">Experience and Education can be edited in the full studio mode.</p>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden"
          >
            {renderPreview()}
          </motion.div>
        )}
      </div>
    </div>
  );
};
