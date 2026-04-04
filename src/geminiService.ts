import { GoogleGenAI, GenerateContentResponse, Modality, ThinkingLevel, Type } from "@google/genai";
import { UserProfile } from "./userService";
import { streamOpenRouterWithFailover, DEFAULT_FREE_MODEL } from "./openRouterService";

const API_KEY = process.env.GEMINI_API_KEY;

let aiInstance: GoogleGenAI | null = null;

export function getGemini() {
  if (!aiInstance) {
    if (!API_KEY) {
      throw new Error("GEMINI_API_KEY is not defined in the environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey: API_KEY });
  }
  return aiInstance;
}

export type AppMode = 'General' | 'Study' | 'Professional' | 'Data';

export interface Artifact {
  type: 'table' | 'cv' | 'quiz' | 'chart' | 'web';
  data: any;
}

export interface Message {
  role: "user" | "model";
  parts: { 
    text?: string; 
    inlineData?: { mimeType: string; data: string };
    fileUrl?: string;
    mimeType?: string;
  }[];
  timestamp: number;
  type?: "text" | "image" | "audio";
  isGroundingUsed?: boolean;
  groundingUrls?: string[];
  artifacts?: Artifact[];
  usedMemories?: string[];
}

export const ARTIFACT_PROMPT = `
IMPORTANT: When you generate specialized content (tables, CVs, quizzes, charts, or web code), you MUST wrap the JSON data exactly like this:
[ARTIFACT_START]
{
  "type": "table" | "cv" | "quiz" | "chart" | "web",
  "data": { ... }
}
[ARTIFACT_END]

CRITICAL RULES:
1. Do NOT mix multiple types in one artifact. If you need a table and a quiz, use two separate [ARTIFACT_START]...[ARTIFACT_END] blocks.
2. ALWAYS include the [ARTIFACT_END] tag.
3. The "data" field MUST contain the specific fields for that type.

Field structures for "data":
- "table": { "initialData": [["Header1", "Header2"], ["Row1Col1", "Row1Col2"]] }
- "cv": { "name": "...", "title": "...", "summary": "...", "experience": [...], "education": [...], "skills": [...] }
- "quiz": { "title": "...", "questions": [{ "id": 1, "question": "...", "options": ["A", "B"], "correctAnswer": 0, "explanation": "..." }], "timePerQuestion": 15, "maxLives": 3 }
- "chart": { "type": "bar" | "line" | "pie", "title": "...", "data": [{"name": "A", "value": 10}], "config": { "xAxis": "name", "yAxis": "value" } }
- "web": { "html": "...", "css": "...", "js": "...", "title": "..." }

When generating a quiz in Arabic, ensure the tone is challenging and the questions are precise.
`;

export const MODE_PROMPTS: Record<AppMode, string> = {
  General: "You are Novel AI, a helpful and highly intelligent assistant. You provide concise, accurate, and professional answers. If the user asks you to generate, draw, or create an image/picture, you MUST respond with exactly this format: [GENERATE_IMAGE: <detailed image prompt in English>]. If the user asks to generate music, a song, or audio, respond with exactly: [GENERATE_MUSIC: <detailed prompt in English>] for a short clip, or [GENERATE_MUSIC_PRO: <detailed prompt>] for a full song. If the user asks to generate voice/speech with specific performance/structure, respond with exactly: [GENERATE_VOICE: {\"text\": \"<text to speak>\", \"lang\": \"ar-SA\", \"pitch\": 1.0, \"rate\": 1.0}]. Do not use artifacts for images or music. Use Google Search grounding when needed for real-time information. Use LaTeX for math/chemistry equations ($ for inline, $$ for blocks)." + ARTIFACT_PROMPT,
  Study: "You are Novel Study Mode. Your goal is to help the user learn. Break down complex topics into simple steps, provide examples, ask follow-up questions to test understanding, and create study plans. Use a supportive and educational tone. Create interactive, strict, and challenging quizzes when appropriate using the [ARTIFACT_START] format. For quizzes, ensure they are 'Strict' (صارمة) with timers and lives. Use LaTeX for all mathematical and chemical equations." + ARTIFACT_PROMPT,
  Professional: "You are Novel Professional Mode. You specialize in creating high-quality CVs, professional reports, cover letters, and business documents. Use formal language, professional formatting, and focus on impact and clarity. When asked for a CV or resume, ALWAYS use the [ARTIFACT_START] format with type 'cv'." + ARTIFACT_PROMPT,
  Data: "You are Novel Data & Tables Mode. You specialize in organizing information into structured tables, analyzing Excel/CSV data, and creating reports based on data. When presenting data or requested for a chart, ALWAYS use the [ARTIFACT_START] format with type 'table' or 'chart'." + ARTIFACT_PROMPT
};

export interface VoicePrompt {
  text: string;
  lang?: string;
  pitch?: number;
  rate?: number;
}

export function parseArtifacts(text: string): { cleanText: string; artifacts: Artifact[]; imagePrompts: string[]; musicPrompts: { prompt: string, isPro: boolean }[]; voicePrompts: VoicePrompt[] } {
  const artifacts: Artifact[] = [];
  const imagePrompts: string[] = [];
  const musicPrompts: { prompt: string, isPro: boolean }[] = [];
  const voicePrompts: VoicePrompt[] = [];
  let cleanText = text;
  
  // Extract image generation prompts
  const imageRegex = /\[GENERATE_IMAGE:\s*(.*?)\]/g;
  let imgMatch;
  while ((imgMatch = imageRegex.exec(text)) !== null) {
    if (imgMatch[1].trim()) {
      imagePrompts.push(imgMatch[1].trim());
    }
    cleanText = cleanText.replace(imgMatch[0], '');
  }

  // Extract music generation prompts
  const musicRegex = /\[GENERATE_MUSIC:\s*(.*?)\]/g;
  let musicMatch;
  while ((musicMatch = musicRegex.exec(text)) !== null) {
    if (musicMatch[1].trim()) {
      musicPrompts.push({ prompt: musicMatch[1].trim(), isPro: false });
    }
    cleanText = cleanText.replace(musicMatch[0], '');
  }

  const musicProRegex = /\[GENERATE_MUSIC_PRO:\s*(.*?)\]/g;
  let musicProMatch;
  while ((musicProMatch = musicProRegex.exec(text)) !== null) {
    if (musicProMatch[1].trim()) {
      musicPrompts.push({ prompt: musicProMatch[1].trim(), isPro: true });
    }
    cleanText = cleanText.replace(musicProMatch[0], '');
  }

  // Extract voice generation prompts
  const voiceRegex = /\[GENERATE_VOICE:\s*({.*?})\]/g;
  let voiceMatch;
  while ((voiceMatch = voiceRegex.exec(text)) !== null) {
    try {
      const voiceData = JSON.parse(voiceMatch[1]);
      if (voiceData && voiceData.text) {
        voicePrompts.push(voiceData);
      }
    } catch (e) {
      console.warn("Failed to parse voice prompt JSON:", e);
    }
    cleanText = cleanText.replace(voiceMatch[0], '');
  }

  // Also check for unclosed image tags to hide them during streaming
  const unclosedImgMatch = cleanText.match(/\[GENERATE_IMAGE:[\s\S]*?$/);
  if (unclosedImgMatch && !cleanText.includes(']', unclosedImgMatch.index)) {
    cleanText = cleanText.replace(unclosedImgMatch[0], '*(جاري إنشاء الصورة...)*');
  }

  const unclosedMusicMatch = cleanText.match(/\[GENERATE_MUSIC:[\s\S]*?$/);
  if (unclosedMusicMatch && !cleanText.includes(']', unclosedMusicMatch.index)) {
    cleanText = cleanText.replace(unclosedMusicMatch[0], '*(جاري إنشاء المقطع الصوتي...)*');
  }

  const unclosedMusicProMatch = cleanText.match(/\[GENERATE_MUSIC_PRO:[\s\S]*?$/);
  if (unclosedMusicProMatch && !cleanText.includes(']', unclosedMusicProMatch.index)) {
    cleanText = cleanText.replace(unclosedMusicProMatch[0], '*(جاري إنشاء المقطع الصوتي الكامل...)*');
  }
  
  // Improved regex to handle cases where the model might be slow or forget the end tag (though end tag is preferred)
  const regex = /\[ARTIFACT_START\]([\s\S]*?)\[ARTIFACT_END\]/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    try {
      const jsonStr = match[1].trim();
      const artifact = JSON.parse(jsonStr);
      
      // Basic validation to ensure it follows the {type, data} structure
      if (artifact.type && (artifact.data || artifact.initialData)) {
        // Handle legacy format where data might be at top level
        if (!artifact.data && artifact.initialData) {
          artifact.data = { initialData: artifact.initialData };
        }
        artifacts.push(artifact);
        cleanText = cleanText.replace(match[0], '');
      }
    } catch (e) {
      // If it's not valid JSON yet, we just ignore it (it might be still streaming)
      console.warn("Failed to parse artifact JSON:", e);
    }
  }
  
  // Also check for unclosed artifacts at the end of the text (for better streaming UX)
  const unclosedMatch = cleanText.match(/\[ARTIFACT_START\]([\s\S]*?)$/);
  if (unclosedMatch && !cleanText.includes('[ARTIFACT_END]', unclosedMatch.index)) {
    // We don't add it to artifacts yet because it's incomplete, 
    // but we hide the raw tag from cleanText to keep the UI clean
    cleanText = cleanText.replace(unclosedMatch[0], '*(جاري إنشاء المحتوى التفاعلي...)*');
  }
  
  return { cleanText: cleanText.trim(), artifacts, imagePrompts, musicPrompts, voicePrompts };
}

export async function generateChatSummary(messages: Message[], language: 'ar' | 'en'): Promise<string> {
  const ai = getGemini();
  const chatHistory = messages.map(m => `${m.role}: ${m.parts[0].text}`).join('\n').substring(0, 2000);
  const prompt = `Summarize the following chat conversation in one short sentence (max 10 words). 
  Conversation:
  ${chatHistory}
  Language: ${language === 'ar' ? 'Arabic' : 'English'}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text.trim();
  } catch (e) {
    console.error("Failed to generate summary:", e);
    return "";
  }
}

export async function generateContextualSuggestions(lastMessage: string, language: 'ar' | 'en'): Promise<string[]> {
  const ai = getGemini();
  const prompt = `Based on the following AI response, suggest 3 short (max 4 words) follow-up actions or questions for the user. 
  Response: "${lastMessage.substring(0, 500)}"
  Language: ${language === 'ar' ? 'Arabic' : 'English'}
  Return ONLY a JSON array of strings.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to generate suggestions:", e);
    return language === 'ar' ? ["لخص هذا", "اشرح أكثر", "ترجم للإنجليزية"] : ["Summarize", "Explain more", "Translate to Arabic"];
  }
}

export async function* streamChat(
  messages: Message[], 
  options: { 
    mode?: AppMode; 
    useSearch?: boolean; 
    deepThinking?: boolean;
    model?: string;
    customPersona?: any;
    profile?: UserProfile;
  } = {}
) {
  try {
    const ai = getGemini();
    
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role,
      parts: msg.parts,
    }));

    const lastMessage = messages[messages.length - 1];
    const mode = options.mode || 'General';
    const profile = options.profile || { skills: [], preferences: {}, memories: [] };
    
    const userContext = `
[USER_CONTEXT]
Skills: ${profile.skills.join(', ') || 'None yet'}
Preferences: ${JSON.stringify(profile.preferences)}
Recent Memories: ${profile.memories.slice(0, 5).map(m => m.content).join(' | ')}
Custom Persona: ${options.customPersona ? JSON.stringify(options.customPersona) : 'Default'}
[/USER_CONTEXT]
Use this context to personalize your response. ${options.customPersona ? `Adjust your tone to be ${options.customPersona.tone} and prioritize ${options.customPersona.creativity > 70 ? 'creativity' : 'professionalism'}.` : ''}
`;

    const chat = ai.chats.create({
      model: options.model || "gemini-3.1-pro-preview",
      config: {
        systemInstruction: MODE_PROMPTS[mode] + userContext,
        tools: options.useSearch ? [{ googleSearch: {} }] : undefined,
        thinkingConfig: options.deepThinking ? { thinkingLevel: ThinkingLevel.HIGH } : undefined,
      },
      history,
    });

    const result = await chat.sendMessageStream({
      message: lastMessage.parts[0].text || "",
    });

    for await (const chunk of result) {
      yield {
        text: chunk.text,
        groundingMetadata: chunk.candidates?.[0]?.groundingMetadata
      };
    }
  } catch (error: any) {
    console.error("Gemini error, falling back to OpenRouter:", error);
    
    // Fallback logic: check if it's a quota error or any other error
    const openRouterMessages = messages.map(msg => ({
      role: msg.role === "model" ? "assistant" : "user",
      content: msg.parts[0].text || ""
    }));
    
    const stream = streamOpenRouterWithFailover(DEFAULT_FREE_MODEL, openRouterMessages);
    for await (const chunk of stream) {
      yield { text: chunk };
    }
  }
}

export async function generateImage(prompt: string) {
  const ai = getGemini();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image data returned from model");
}

export async function generateMusic(prompt: string, isPro: boolean = false) {
  const model = isPro ? "google/lyria-3-pro-preview" : "google/lyria-3-clip-preview";
  
  const response = await fetch("/api/chat/openrouter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate music via OpenRouter");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  // OpenRouter might return the audio as a base64 string in the content, or as a markdown audio link, or in a specific audio field.
  // We'll try to extract it from the content if it's base64, or check if there's an audio object.
  let audioBase64 = "";
  let mimeType = "audio/wav";
  let lyrics = content;

  if (data.choices?.[0]?.message?.audio) {
    audioBase64 = data.choices[0].message.audio.data;
    mimeType = "audio/wav"; // Or whatever it returns
  } else if (content.includes("data:audio")) {
    // Extract base64 from data URI
    const match = content.match(/data:(audio\/[^;]+);base64,([^"'\s]+)/);
    if (match) {
      mimeType = match[1];
      audioBase64 = match[2];
      lyrics = content.replace(match[0], "");
    }
  } else {
    // If it's just a raw base64 string
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    if (base64Regex.test(content.trim()) && content.trim().length > 100) {
      audioBase64 = content.trim();
      lyrics = "";
    }
  }

  if (!audioBase64) {
    console.warn("Could not extract audio from OpenRouter response:", data);
    throw new Error("No audio data returned from OpenRouter");
  }

  return { audioBase64, mimeType, lyrics };
}

export async function textToSpeech(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error("Speech synthesis is not supported in this browser."));
      return;
    }

    // We don't return an audio URL for SpeechSynthesis, we just play it directly.
    // However, the current App.tsx expects an audio URL.
    // To bridge this, we can return a special protocol or handle it differently.
    // Actually, it's better to just play it here and return a dummy URL, or change App.tsx.
    // Let's change App.tsx to handle this better, but for now, we can just reject and say "Use native".
    // Wait, let's just return a dummy URL and handle the actual speech in App.tsx, or handle it here.
    reject(new Error("USE_NATIVE_TTS"));
  });
}

export async function analyzeConversation(input: string, language: 'ar' | 'en') {
  try {
    const ai = getGemini();
    const prompt = `
      Analyze the following user input and extract:
      1. Any new skills the user mentioned they have.
      2. Any personal preferences or information (name, age, interests).
      3. A very concise summary of this interaction to be stored as a "memory".

      User Input: "${input}"
      Language: ${language === 'ar' ? 'Arabic' : 'English'}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ text: prompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            preferences: { type: Type.OBJECT, properties: {}, additionalProperties: { type: Type.STRING } },
            memory: { type: Type.STRING }
          },
          required: ["skills", "preferences", "memory"]
        }
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Analysis failed:", e);
    return { skills: [], preferences: {}, memory: input.slice(0, 50) + "..." };
  }
}
