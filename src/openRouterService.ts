export interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
    request: string;
    image: string;
  };
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type: string;
  };
  description: string;
}

export async function getModels(): Promise<OpenRouterModel[]> {
  const response = await fetch("/api/chat/openrouter/models");
  const data = await response.json();
  return data.data;
}

const MODEL_ID_MAP: Record<string, string> = {
  "google/gemma-3-4b:free": "google/gemma-3-4b-it:free",
  "google/gemma-3-12b:free": "google/gemma-3-12b-it:free",
  "google/gemma-3-27b:free": "google/gemma-3-27b-it:free",
  "google/gemma-3n-2b:free": "google/gemma-3n-2b-it:free",
  "google/gemma-3n-4b:free": "google/gemma-3n-4b-it:free",
  "google/gemini-2.0-flash-exp:free": "google/gemini-2.0-flash-001",
  "google/gemini-2.0-flash-lite-preview-02-05:free": "google/gemini-2.0-flash-lite-001",
};

export async function* streamOpenRouterWithFailover(
  preferredModel: string,
  messages: any[],
  options: any = {}
) {
  // Translate preferred model if needed
  const initialModel = MODEL_ID_MAP[preferredModel] || preferredModel;
  
  // Fetch server-side blacklist
  let serverBlacklist: string[] = [];
  try {
    const blacklistRes = await fetch("/api/chat/openrouter/blacklist");
    if (blacklistRes.ok) {
      serverBlacklist = await blacklistRes.json();
    }
  } catch (e) {
    console.warn("Failed to fetch server blacklist:", e);
  }

  const localBlacklist = getBlacklist();
  const combinedBlacklist = new Set([...serverBlacklist, ...Array.from(localBlacklist)]);
  
  // Filter out blacklisted models and prioritize preferred
  const availableFreeModels = FREE_MODELS.filter(m => !combinedBlacklist.has(m));
  const modelsToTry = [initialModel, ...availableFreeModels.filter(m => m !== initialModel)];
  
  // Filter out blacklisted models from the final list
  const filteredModelsToTry = modelsToTry.filter(m => !combinedBlacklist.has(m) || m === initialModel);

  const MAX_RETRIES = 2;
  const RETRY_DELAY = 1000; // 1 second

  for (const model of filteredModelsToTry) {
    // Translate current model in loop just in case it's an old ID from FREE_MODELS (though we updated it)
    const activeModel = MODEL_ID_MAP[model] || model;
    
    let retryCount = 0;
    while (retryCount <= MAX_RETRIES) {
      try {
        const response = await fetch("/api/chat/openrouter", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: activeModel,
            messages,
            stream: true,
            ...options,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
          
          // Handle 429 (Rate Limit) with retry
          if (response.status === 429 && retryCount < MAX_RETRIES) {
            retryCount++;
            console.warn(`Rate limited (429) for ${model}. Retrying in ${RETRY_DELAY * retryCount}ms... (Attempt ${retryCount}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
            continue;
          }
          
          throw new Error(errorMessage);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;
            
            const data = trimmedLine.slice(6);
            if (data === "[DONE]") return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || "";
              if (content) {
                yield content;
              }
            } catch (e) {
              console.warn("Error parsing SSE chunk:", e);
            }
          }
        }
        return; // Success, exit the loop
      } catch (error: any) {
        const errorMessage = error.message?.toLowerCase() || "";
        
        // If we've exhausted retries for this model or it's not a retryable error
        if (retryCount >= MAX_RETRIES || !errorMessage.includes("429")) {
          console.warn(`Model ${model} failed after ${retryCount} retries:`, error);
          
          // If it's a "not found" or "invalid" error, blacklist it
          if (!errorMessage.includes("guardrail") && !errorMessage.includes("data policy")) {
            if (
              errorMessage.includes("not found") || 
              errorMessage.includes("invalid model") ||
              errorMessage.includes("not a valid model") ||
              errorMessage.includes("404") ||
              errorMessage.includes("400") ||
              errorMessage.includes("402") ||
              errorMessage.includes("insufficient credits") ||
              errorMessage.includes("500") ||
              errorMessage.includes("quota") ||
              errorMessage.includes("no endpoints")
            ) {
              addToBlacklist(model);
              // Also report to server
              try {
                await fetch("/api/chat/openrouter/blacklist", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ modelId: model }),
                });
              } catch (e) {
                console.warn("Failed to report blacklist to server:", e);
              }
            }
          }
          break; // Exit the retry loop for this model and try next model in outer loop
        }
        
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
      }
    }
  }
  throw new Error("All available models failed to respond. This usually happens due to high traffic on OpenRouter's free tier. Please try again in a few moments.");
}

// Model Blacklist Management
const BLACKLIST_KEY = 'novel_ai_model_blacklist';

function getBlacklist(): Set<string> {
  try {
    const stored = localStorage.getItem(BLACKLIST_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function addToBlacklist(modelId: string) {
  const blacklist = getBlacklist();
  blacklist.add(modelId);
  localStorage.setItem(BLACKLIST_KEY, JSON.stringify(Array.from(blacklist)));
  console.log(`Model ${modelId} added to blacklist.`);
}

export function clearBlacklist() {
  localStorage.removeItem(BLACKLIST_KEY);
}

export const FREE_MODELS = [
  "openrouter/free",
  "google/gemini-2.0-flash-001",
  "google/gemini-2.0-flash-lite-001",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-12b-it:free"
];

export const DEFAULT_FREE_MODEL = "openrouter/free";
