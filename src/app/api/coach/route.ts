import { NextResponse } from "next/server";
import { coachRequestSchema, coachResponseSchema } from "@/lib/validations";
import { generateRuleBasedAdvice } from "@/lib/ai/rule-based";
import { getLLMConfig, buildSystemPrompt, generateLLMResponse } from "@/lib/ai/llm";
import type { CoachContext } from "@/types";

export const runtime = "edge";

/**
 * Validate + sanitize a coach response with Zod so malformed or unsafe
 * model output is caught before reaching the client. Falls back to a
 * safe message if validation fails.
 */
function safeResponse(message: string, isFallback: boolean, provider: string, error?: string) {
  const parsed = coachResponseSchema.safeParse({ message, isFallback });
  const safeMessage = parsed.success ? parsed.data.message : "I couldn't generate a valid response. Please try rephrasing your question.";
  return NextResponse.json({ message: safeMessage, isFallback, provider, ...(error ? { error } : {}) });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = coachRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.issues }, { status: 422 });
  }

  const { message, context } = parsed.data;
  const ctx: CoachContext = {
    goal: context.goal as CoachContext["goal"],
    calorieTarget: context.calorieTarget,
    proteinTarget: context.proteinTarget,
    caloriesConsumed: context.caloriesConsumed,
    proteinConsumed: context.proteinConsumed,
    remainingCalories: context.remainingCalories,
    remainingProtein: context.remainingProtein,
    steps: context.steps,
    stepsTarget: context.stepsTarget,
    waterGlasses: context.waterGlasses,
    sleepHours: context.sleepHours,
    weightKg: context.weightKg,
    weightTrend: context.weightTrend as CoachContext["weightTrend"],
    foodSpentINR: context.foodSpentINR,
    dailyBudgetINR: context.dailyBudgetINR,
    dietaryPreference: context.dietaryPreference as CoachContext["dietaryPreference"],
  };

  const config = getLLMConfig();

  // No key configured → rule-based fallback so the coach stays functional.
  if (!config) {
    const advice = generateRuleBasedAdvice(ctx);
    const reply = `${advice.summary}\n\n${advice.actions.map((a) => `• ${a}`).join("\n")}`;
    return safeResponse(reply, true, "rule-based");
  }

  try {
    const systemPrompt = buildSystemPrompt(ctx);
    const content = await generateLLMResponse(config, systemPrompt, message);
    return safeResponse(content, false, config.provider);
  } catch (err) {
    // Graceful degradation: fall back to rule-based on provider error.
    const advice = generateRuleBasedAdvice(ctx);
    const reason = err instanceof Error ? err.message : "unknown error";
    const reply = `The AI provider returned an error (${reason}). Here's a rule-based fallback instead:\n\n${advice.summary}\n\n${advice.actions.map((a) => `• ${a}`).join("\n")}`;
    return safeResponse(reply, true, "rule-based", reason);
  }
}
