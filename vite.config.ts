import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // في الإنتاج، لا تقرأ من .env لأنه غير موجود في Vercel
  const env = mode === 'production' ? {} : loadEnv(mode, '.', '');
  
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // لا تعرّض API Keys في الواجهة الأمامية مباشرة
      // استخدم proxy للـ API بدلاً من ذلك
      'process.env.API_URL': JSON.stringify(process.env.API_URL || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify – file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
