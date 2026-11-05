import type { CoachContext } from "@/types";

// Supported AI providers:
//   openai  — OpenAI Chat Completions API
//   gemini  — Google Generative Language API
//   groq    — Groq (fast inference platform; OpenAI-compatible)
//   grok    — xAI Grok (api.x.ai; OpenAI-compatible)
export type AIProvider = "openai" | "gemini" | "groq" | "grok";

export interface LLMConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

/** Read the AI provider config from environment. Returns null if not configured. */
export function getLLMConfig(): LLMConfig | null {
  const provider = (process.env.AI_PROVIDER as AIProvider | undefined) ?? "groq";
  let apiKey = "";
  let model = "";

  switch (provider) {
    case "openai":
      apiKey = process.env.OPENAI_API_KEY ?? "";
      model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      break;
    case "gemini":
      apiKey = process.env.GEMINI_API_KEY ?? "";
      model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      break;
    case "groq":
      apiKey = process.env.GROQ_API_KEY ?? "";
      model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
      break;
    case "grok":
      apiKey = process.env.GROK_API_KEY ?? "";
      model = process.env.GROK_MODEL || "grok-2-latest";
      break;
    default:
      return null;
  }

  if (!apiKey || apiKey.includes("your-")) return null;
  return { provider, apiKey, model };
}

/** Build the system prompt describing the coach role and the user's context. */
export function buildSystemPrompt(ctx: CoachContext): string {
  return `You are Health AI Coach, a supportive, evidence-aware health assistant for an Indian user.
You help with nutrition, activity, workouts, budget and protein-cost decisions.
Guidelines:
- Be concise, friendly and practical. Use the user's real logged data provided below.
- Use Indian context (₹, common Indian foods, Swiggy/Zomato delivery).
- NEVER guarantee weight-loss results or give medical diagnoses. Suggest professional advice when relevant.
- Do NOT do arithmetic the app already computed — reference the numbers given. For new calculations, keep them simple and clearly approximate.
- If you recommend foods, note whether they suit the user's dietary preference.
- Keep responses under ~180 words.

USER CONTEXT:
- Goal: ${ctx.goal}
- Daily calorie target: ${ctx.calorieTarget} kcal (consumed ${ctx.caloriesConsumed}, remaining ${ctx.remainingCalories})
- Protein target: ${ctx.proteinTarget}g (consumed ${ctx.proteinConsumed}g, remaining ${Math.max(0, ctx.remainingProtein)}g)
- Steps today: ${ctx.steps} / target ${ctx.stepsTarget}
- Water: ${ctx.waterGlasses} glasses, Sleep: ${ctx.sleepHours}h
- Current weight: ${ctx.weightKg ?? "unknown"} kg, trend: ${ctx.weightTrend}
- Food spent today: ₹${ctx.foodSpentINR} / budget ₹${ctx.dailyBudgetINR}
- Dietary preference: ${ctx.dietaryPreference}`;
}

/** Call the configured LLM. Returns the assistant text. */
export async function generateLLMResponse(config: LLMConfig, systemPrompt: string, userMessage: string): Promise<string> {
  switch (config.provider) {
    case "openai":
      return callOpenAICompatible(config, systemPrompt, userMessage, "https://api.openai.com/v1/chat/completions");
    case "groq":
      return callOpenAICompatible(config, systemPrompt, userMessage, "https://api.groq.com/openai/v1/chat/completions");
    case "grok":
      // xAI Grok uses an OpenAI-compatible Chat Completions endpoint.
      return callOpenAICompatible(config, systemPrompt, userMessage, "https://api.x.ai/v1/chat/completions");
    case "gemini":
      return callGemini(config, systemPrompt, userMessage);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

async function callOpenAICompatible(config: LLMConfig, systemPrompt: string, userMessage: string, url: string): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.5,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${config.provider} API error ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error(`${config.provider} returned empty content`);
  return content.trim();
}

async function callGemini(config: LLMConfig, systemPrompt: string, userMessage: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 600 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`gemini API error ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof content !== "string" || !content.trim()) throw new Error("gemini returned empty content");
  return content.trim();
}
