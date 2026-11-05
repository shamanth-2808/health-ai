"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HeartPulse, LogIn, UserPlus, ArrowLeft, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useDataStore } from "@/lib/store/data-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const store = useDataStore();
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [info, setInfo] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!auth.supabaseAuthEnabled) return;
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error: err } = await auth.signIn(email.trim(), password);
        if (err) setError(err);
        else router.push(store.onboardingComplete ? "/dashboard" : "/onboarding");
      } else {
        const { error: err, needsConfirmation } = await auth.signUp(email.trim(), password);
        if (err) setError(err);
        else if (needsConfirmation) {
          setInfo("Account created. Check your email to confirm, then sign in.");
          setMode("login");
        } else {
          router.push("/onboarding");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const tryDemo = () => {
    store.resetToDemo();
    router.push("/dashboard");
  };

  // When Supabase is not configured, show the demo-mode explanation.
  if (!auth.supabaseAuthEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <HeartPulse className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">Health AI</span>
            </div>
            <div className="mb-6 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Supabase isn't configured, so account login isn't available. You can explore the full app with clearly-labeled demo data — no credentials needed. See the README to enable Supabase auth.</span>
            </div>
            <Button className="w-full" size="lg" onClick={tryDemo}>
              <Sparkles className="h-4 w-4" /> Try with Demo Data
            </Button>
            <Button variant="ghost" className="mt-2 w-full" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold">Health AI</span>
              <p className="text-xs text-muted-foreground">{mode === "login" ? "Welcome back" : "Create your account"}</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Field label="Email" htmlFor="email">
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </Field>

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            {info && (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{info}</span>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {mode === "login" ? <><LogIn className="h-4 w-4" /> Sign in</> : <><UserPlus className="h-4 w-4" /> Create account</>}
              {busy && <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>Don't have an account? <button onClick={() => { setMode("signup"); setError(""); setInfo(""); }} className="font-medium text-primary hover:underline">Sign up</button></>
            ) : (
              <>Already have an account? <button onClick={() => { setMode("login"); setError(""); setInfo(""); }} className="font-medium text-primary hover:underline">Sign in</button></>
            )}
          </div>

          <div className="mt-6 border-t pt-4">
            <p className="mb-2 text-center text-xs text-muted-foreground">or continue without an account</p>
            <Button variant="outline" className="w-full" onClick={tryDemo}>
              <Sparkles className="h-4 w-4" /> Try with Demo Data
            </Button>
          </div>

          <button onClick={() => router.push("/")} className="mt-4 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Back to home
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
