"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Returns null when env vars are not configured,
 * which lets the app fall back to local demo mode gracefully.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url.includes("your-project-ref") || anonKey.includes("your-anon")) {
    return null;
  }

  return createBrowserClient(url, anonKey);
}

/** True when a real Supabase project is configured. */
export function isSupabaseConfigured(): boolean {
  return createSupabaseBrowserClient() !== null;
}
