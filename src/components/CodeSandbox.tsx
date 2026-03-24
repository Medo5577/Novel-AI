import React, { useState, useEffect } from 'react';
import { Play, Code, Maximize2, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CodeSandboxProps {
  html: string;
  css?: string;
  js?: string;
  title?: string;
}

export const CodeSandbox: React.FC<CodeSandboxProps> = ({ html, css = '', js = '', title = 'Web Preview' }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0);

  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { background: #09090b; color: white; font-family: sans-serif; }
          ${css}
        </style>
      </head>
      <body>
        ${html}
        <script>${js}</script>
      </body>
    </html>
  `;

  return (
    <div className={`glass-panel rounded-3xl border-white/5 overflow-hidden flex flex-col transition-all duration-500 ${isFullscreen ? 'fixed inset-4 z-[100] bg-zinc-950 shadow-2xl' : 'w-full h-[500px]'}`}>
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-2">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-800 rounded-lg p-1">
            <button 
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${activeTab === 'preview' ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Play className="w-3 h-3 inline-block mr-1" /> Preview
            </button>
            <button 
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${activeTab === 'code' ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Code className="w-3 h-3 inline-block mr-1" /> Code
            </button>
          </div>
          <button onClick={() => setKey(prev => prev + 1)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500" title="Reload">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500">
            {isFullscreen ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-zinc-950">
        <AnimatePresence mode="wait">
          {activeTab === 'preview' ? (
            <motion.iframe
              key={`preview-${key}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              srcDoc={srcDoc}
              className="w-full h-full border-none"
              title="Sandbox Preview"
            />
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full p-6 overflow-auto font-mono text-xs text-emerald-400 bg-zinc-950"
            >
              <pre>{`<!-- HTML -->\n${html}\n\n/* CSS */\n${css}\n\n// JS\n${js}`}</pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
