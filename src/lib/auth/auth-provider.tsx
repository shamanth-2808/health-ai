"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** True only when a real Supabase project is configured. */
  supabaseAuthEnabled: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const client = React.useMemo(() => createSupabaseBrowserClient(), []);
  const supabaseAuthEnabled = client !== null;
  const router = useRouter();

  React.useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }
    // Get current session
    client.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    // Subscribe to auth changes
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [client]);

  const signIn = React.useCallback(
    async (email: string, password: string) => {
      if (!client) return { error: "Supabase is not configured." };
      const { error } = await client.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [client],
  );

  const signUp = React.useCallback(
    async (email: string, password: string) => {
      if (!client) return { error: "Supabase is not configured.", needsConfirmation: false };
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) return { error: error.message, needsConfirmation: false };
      // If email confirmation is required, session will be null
      return { error: null, needsConfirmation: data.session === null };
    },
    [client],
  );

  const signOut = React.useCallback(async () => {
    if (!client) return;
    await client.auth.signOut();
    setUser(null);
    router.push("/");
  }, [client, router]);

  const value: AuthContextValue = {
    user,
    loading,
    supabaseAuthEnabled,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
