"use client";

import * as React from "react";
import { Send, Bot, User as UserIcon, Sparkles, AlertCircle } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useDailySummary } from "@/lib/store/use-daily-summary";
import { weightTrendDirection } from "@/lib/calculations/bmi";
import { SUGGESTED_QUESTIONS } from "@/lib/ai/rule-based";
import { uid } from "@/lib/utils";
import type { ChatMessage, CoachContext } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function CoachPage() {
  const store = useDataStore();
  const { nutrition, activitySummary, waterGlasses, sleepHours, todayWeight, foodSpentINR, calorieTarget, proteinTarget, remainingCalories, remainingProtein } = useDailySummary();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [provider, setProvider] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const ctx: CoachContext | null = React.useMemo(() => {
    if (!store.profile) return null;
    const trend = weightTrendDirection(store.weightLogs);
    return {
      goal: store.profile.fitnessGoal,
      calorieTarget,
      proteinTarget,
      caloriesConsumed: nutrition.calories,
      proteinConsumed: nutrition.protein,
      remainingCalories,
      remainingProtein,
      steps: activitySummary.steps,
      stepsTarget: 8000,
      waterGlasses,
      sleepHours,
      weightKg: todayWeight ?? store.profile.currentWeightKg,
      weightTrend: trend.direction,
      foodSpentINR,
      dailyBudgetINR: store.profile.dailyFoodBudgetINR,
      dietaryPreference: store.profile.dietaryPreference,
    };
  }, [store.profile, store.weightLogs, nutrition, activitySummary, waterGlasses, sleepHours, todayWeight, foodSpentINR, calorieTarget, proteinTarget, remainingCalories, remainingProtein]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading || !ctx) return;
    const userMsg: ChatMessage = { id: uid("msg"), role: "user", content: text.trim(), createdAt: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), context: ctx }),
      });
      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: uid("msg"),
        role: "assistant",
        content: data.message ?? "Sorry, I couldn't generate a response.",
        createdAt: new Date().toISOString(),
        isFallback: data.isFallback ?? true,
      };
      setMessages((m) => [...m, assistantMsg]);
      setProvider(data.provider ?? "rule-based");
    } catch {
      setMessages((m) => [...m, {
        id: uid("msg"),
        role: "assistant",
        content: "Connection error. Please try again.",
        createdAt: new Date().toISOString(),
        isFallback: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!store.profile) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="AI Health Coach" description="Ask about your nutrition, activity, budget or next steps. Uses your logged data." />

      {/* Provider status */}
      <div className={cn("flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs", provider && provider !== "rule-based" ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200" : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200")}>
        {provider && provider !== "rule-based" ? <Sparkles className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <span>
          {messages.length === 0
            ? "AI provider status will show after your first message. If no API key is set, a rule-based fallback answers so the coach always works."
            : provider && provider !== "rule-based"
              ? `Responding via ${provider} (LLM).`
              : "Responding via rule-based fallback. Set AI_PROVIDER + an API key in .env to enable LLM responses."}
        </span>
      </div>

      {/* Chat */}
      <Card className="flex h-[60vh] flex-col">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto scrollbar-thin p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-7 w-7" />
              </div>
              <h3 className="font-semibold">Ask your Health AI Coach</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Try one of these, or type your own question.</p>
              <div className="mt-5 grid w-full max-w-lg gap-2 sm:grid-cols-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button key={q} onClick={() => send(q)} className="rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={cn("max-w-[80%] rounded-lg px-4 py-2.5 text-sm", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                <p className="whitespace-pre-line">{m.content}</p>
                {m.role === "assistant" && m.isFallback && (
                  <Badge variant="secondary" className="mt-2 text-xs">rule-based fallback</Badge>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><Bot className="h-4 w-4" /></div>
              <div className="flex items-center gap-1 rounded-lg bg-muted px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-3">
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your diet, workout, budget..."
              disabled={loading}
              className="flex h-11 flex-1 rounded-lg border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" size="icon" className="h-11 w-11" disabled={loading || !input.trim()} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
