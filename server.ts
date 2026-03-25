import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

// تم إزالة: import dotenv from "dotenv";
// تم إزالة: dotenv.config();

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
    "HTTP-Referer": process.env.APP_URL,
    "X-Title": "Novel AI",
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // OpenRouter Proxy
  app.get("/api/chat/openrouter/models", async (req, res) => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models");
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("OpenRouter Models Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chat/openrouter/blacklist", (req, res) => {
    res.json(blacklistedModels);
  });

  app.post("/api/chat/openrouter/blacklist", (req, res) => {
    const { modelId } = req.body;
    if (modelId && !blacklistedModels.includes(modelId)) {
      blacklistedModels.push(modelId);
      console.log(`[AGENT] Model blacklisted: ${modelId}`);
    }
    res.json({ success: true, blacklist: blacklistedModels });
  });

  app.delete("/api/chat/openrouter/blacklist", (req, res) => {
    blacklistedModels = [];
    console.log(`[AGENT] Server-side model blacklist cleared.`);
    res.json({ success: true, blacklist: blacklistedModels });
  });

  // OpenRouter Embeddings Proxy
  app.post("/api/embeddings", async (req, res) => {
    try {
      const { model, input, encoding_format } = req.body;
      const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input,
          encoding_format,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Embeddings Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chat/openrouter", async (req, res) => {
    try {
      const { model, messages, stream } = req.body;
      
      if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.startsWith("sk-or-v1-placeholder")) {
        throw new Error("OpenRouter API Key is missing or invalid. Please set OPENROUTER_API_KEY in environment variables.");
      }

      console.log(`[AGENT] Proxying request to OpenRouter: ${model} (stream: ${stream})`);

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
      const statusCode = error.status || (error.message.includes("API Key") ? 401 : 500);
      res.status(statusCode).json({ error: error.message });
    }
  });

  app.post("/api/tasks", (req, res) => {
    const { task, time } = req.body;
    const newTask = { id: Date.now(), task, time, status: 'pending', createdAt: new Date().toISOString() };
    scheduledTasks.push(newTask);
    executionLogs.push({ 
      id: Date.now() + 1, 
      taskId: newTask.id, 
      message: `تمت جدولة المهمة: ${task}`, 
      timestamp: new Date().toISOString(),
      type: 'info'
    });
    res.json({ success: true, tasks: scheduledTasks });
  });

  app.get("/api/tasks", (req, res) => {
    res.json(scheduledTasks);
  });

  app.get("/api/logs", (req, res) => {
    res.json(executionLogs);
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    scheduledTasks = scheduledTasks.filter(t => t.id !== parseInt(id));
    res.json({ success: true, tasks: scheduledTasks });
  });

  // Background task simulator (every 30 seconds for better responsiveness)
  setInterval(() => {
    const now = new Date();
    // Adjust to user's timezone if needed, but for simulation we use server time
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    scheduledTasks.forEach(task => {
      if (task.time === timeStr && task.status === 'pending') {
        console.log(`[AGENT] Executing scheduled task: ${task.task}`);
        task.status = 'executed';
        executionLogs.push({ 
          id: Date.now(), 
          taskId: task.id, 
          message: `جاري تنفيذ المهمة: ${task.task}`, 
          timestamp: new Date().toISOString(),
          type: 'success'
        });
        // In a real app, we'd trigger the Gemini API here
      }
    });
  }, 30000);

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // OpenRouter Proxy
  app.get("/api/chat/openrouter/models", async (req, res) => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models");
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("OpenRouter Models Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chat/openrouter/blacklist", (req, res) => {
    res.json(blacklistedModels);
  });

  app.post("/api/chat/openrouter/blacklist", (req, res) => {
    const { modelId } = req.body;
    if (modelId && !blacklistedModels.includes(modelId)) {
      blacklistedModels.push(modelId);
      console.log(`[AGENT] Model blacklisted: ${modelId}`);
    }
    res.json({ success: true, blacklist: blacklistedModels });
  });

  app.delete("/api/chat/openrouter/blacklist", (req, res) => {
    blacklistedModels = [];
    console.log(`[AGENT] Server-side model blacklist cleared.`);
    res.json({ success: true, blacklist: blacklistedModels });
  });

  // OpenRouter Embeddings Proxy
  app.post("/api/embeddings", async (req, res) => {
    try {
      const { model, input, encoding_format } = req.body;
      const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input,
          encoding_format,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Embeddings Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chat/openrouter", async (req, res) => {
    try {
      const { model, messages, stream } = req.body;
      
      if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.startsWith("sk-or-v1-placeholder")) {
        throw new Error("OpenRouter API Key is missing or invalid. Please set OPENROUTER_API_KEY in environment variables.");
      }

      console.log(`[AGENT] Proxying request to OpenRouter: ${model} (stream: ${stream})`);

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
      const statusCode = error.status || (error.message.includes("API Key") ? 401 : 500);
      res.status(statusCode).json({ error: error.message });
    }
  });

  app.post("/api/tasks", (req, res) => {
    const { task, time } = req.body;
    const newTask = { id: Date.now(), task, time, status: 'pending', createdAt: new Date().toISOString() };
    scheduledTasks.push(newTask);
    executionLogs.push({ 
      id: Date.now() + 1, 
      taskId: newTask.id, 
      message: `تمت جدولة المهمة: ${task}`, 
      timestamp: new Date().toISOString(),
      type: 'info'
    });
    res.json({ success: true, tasks: scheduledTasks });
  });

  app.get("/api/tasks", (req, res) => {
    res.json(scheduledTasks);
  });

  app.get("/api/logs", (req, res) => {
    res.json(executionLogs);
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    scheduledTasks = scheduledTasks.filter(t => t.id !== parseInt(id));
    res.json({ success: true, tasks: scheduledTasks });
  });

  // Background task simulator (every 30 seconds for better responsiveness)
  setInterval(() => {
    const now = new Date();
    // Adjust to user's timezone if needed, but for simulation we use server time
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    scheduledTasks.forEach(task => {
      if (task.time === timeStr && task.status === 'pending') {
        console.log(`[AGENT] Executing scheduled task: ${task.task}`);
        task.status = 'executed';
        executionLogs.push({ 
          id: Date.now(), 
          taskId: task.id, 
          message: `جاري تنفيذ المهمة: ${task.task}`, 
          timestamp: new Date().toISOString(),
          type: 'success'
        });
        // In a real app, we'd trigger the Gemini API here
      }
    });
  }, 30000);

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
