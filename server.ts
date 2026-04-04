import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.startsWith("sk-or-v1-placeholder")) {
  console.error("❌ Error: OPENROUTER_API_KEY is not set in environment variables.");
}

let scheduledTasks: any[] = [];
let executionLogs: any[] = [];
let blacklistedModels: string[] = [];

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.APP_URL || "https://novel-ai.vercel.app",
    "X-Title": "Novel AI",
  }
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;  // ✅ استخدم PORT من البيئة

  app.use(express.json({ limit: '50mb' }));

  // API routes (بدون تغيير)
  // ...

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {  // ✅ اخذ "0.0.0.0"
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
