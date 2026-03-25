  import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

// تعريف التطبيق
const app = express();
const PORT = process.env.PORT || 3000; // تعريف PORT الافتراضي

// Middleware
app.use(express.json({ limit: '50mb' }));

// مثال على Route أساسي لفحص الصحة
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
    console.error("OpenRouter Models Proxy Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Static Files for production
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// تشغيل التطبيق على البورت المحدد
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
