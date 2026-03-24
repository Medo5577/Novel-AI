import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// استخدام المفتاح من السيكريت أو مفتاح افتراضي
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.APP_URL || "https://vercel.com",
    "X-Title": "Novel AI",
  }
});

app.use(express.json({ limit: '50mb' }));

// مسارات الـ API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running on Vercel" });
});

app.post("/api/chat/openrouter", async (req, res) => {
  try {
    const { model, messages, stream } = req.body;
    
    if (!OPENROUTER_API_KEY) {
      return res.status(401).json({ error: "OpenRouter API Key is missing in Vercel Environment Variables" });
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const response = await openai.chat.completions.create({
        model,
        messages,
        stream: true,
      });

      for await (const chunk of response) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const response = await openai.chat.completions.create({
        model,
        messages,
        stream: false,
      });
      res.json(response);
    }
  } catch (error: any) {
    console.error("OpenRouter Proxy Error:", error.message);
    const statusCode = error.status || (error.message.includes("credits") ? 402 : 500);
    res.status(statusCode).json({ 
      error: error.message,
      code: statusCode
    });
  }
});

// مسارات إضافية (المهام واللوجز)
let scheduledTasks: any[] = [];
app.get("/api/tasks", (req, res) => res.json(scheduledTasks));
app.post("/api/tasks", (req, res) => {
  const newTask = { id: Date.now(), ...req.body, status: 'pending' };
  scheduledTasks.push(newTask);
  res.json({ success: true, tasks: scheduledTasks });
});

export default app;
