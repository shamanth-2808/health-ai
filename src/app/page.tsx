"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  UtensilsCrossed,
  Footprints,
  TrendingDown,
  Coins,
  Bot,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useAuth } from "@/lib/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/skeleton";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: UtensilsCrossed, title: "Nutrition Tracking", desc: "Indian food database with macros, protein & fiber", accent: "text-primary" },
  { icon: Footprints, title: "Activity & Workouts", desc: "Log steps, runs, gym sessions & cardio", accent: "text-accent" },
  { icon: TrendingDown, title: "Weight Progress", desc: "Trends with smoothing & goal progress", accent: "text-warning" },
  { icon: Coins, title: "Protein Cost Intelligence", desc: "Compare grocery vs Swiggy vs Zomato protein value", accent: "text-primary" },
  { icon: Bot, title: "AI Health Coach", desc: "Personalized recommendations from your data", accent: "text-accent" },
  { icon: ShieldCheck, title: "Private & Secure", desc: "RLS-protected data, demo mode needs no signup", accent: "text-chart-4" },
];

export default function LandingPage() {
  const router = useRouter();
  const { hydrated, resetToDemo, onboardingComplete, isDemo } = useDataStore();
  const { supabaseAuthEnabled, user } = useAuth();

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  const startOnboarding = () => router.push("/onboarding");
  const tryDemo = () => {
    resetToDemo();
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-16">
        {/* Brand */}
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <Activity className="h-6 w-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-semibold tracking-tight">HealthAI</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Personal Health Platform</span>
          </div>
        </div>

        {/* Hero */}
        <div className="mb-12 max-w-2xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Built for Indian fitness & nutrition
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Understand your body.
            <br />
            <span className="text-primary">Spend smarter. Get stronger.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            Track calories, protein and activity. Compare the real cost of protein across
            grocery, restaurant and delivery. Get AI guidance for your next step.
          </p>
        </div>

        {/* Actions */}
        <div className="flex w-full max-w-xs flex-col gap-2.5">
          {supabaseAuthEnabled && !user && (
            <Button size="lg" className="w-full" onClick={() => router.push("/login")}>
              Sign in <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          <Button size="lg" variant={supabaseAuthEnabled ? "outline" : "default"} className="w-full" onClick={startOnboarding}>
            Get Started <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" className="w-full" onClick={tryDemo}>
            Try with Demo Data
          </Button>
          {(onboardingComplete || isDemo || user) && (
            <Button variant="ghost" className="w-full" onClick={() => router.push("/dashboard")}>
              Continue to Dashboard
            </Button>
          )}
        </div>

        {/* Features */}
        <div className="mt-16 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-3d tilt-3d flex items-start gap-3 rounded-lg p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary">
                <f.icon className={cn("h-[18px] w-[18px]", f.accent)} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 max-w-md text-center text-xs leading-relaxed text-muted-foreground">
          HealthAI provides estimates for informational purposes only and is not a medical
          device. Consult a qualified professional for medical or dietary advice.
        </p>
      </div>
    </div>
  );
}
