"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDataStore } from "@/lib/store/data-store";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav, MobileTopBar } from "@/components/layout/bottom-nav";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { LoadingState } from "@/components/shared/skeleton";

/** Demo data banner shown when the user hasn't onboarded yet. */
function DemoBanner() {
  const { isDemo, onboardingComplete } = useDataStore();
  if (!isDemo || onboardingComplete) return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
      You're viewing labeled demo data. Complete onboarding to start tracking your own health.
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { hydrated, profile, onboardingComplete, isDemo } = useDataStore();
  const router = useRouter();
  const pathname = usePathname();

  // Route guard: redirect when not ready. Only after hydration to avoid flicker.
  React.useEffect(() => {
    if (!hydrated) return;
    if (!profile) {
      router.replace("/");
    } else if (!onboardingComplete && !isDemo) {
      router.replace("/onboarding");
    }
  }, [hydrated, profile, onboardingComplete, isDemo, router, pathname]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  // While redirecting (no profile, or needs onboarding), show a minimal shell
  if (!profile || (!onboardingComplete && !isDemo)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Preparing your workspace..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <MobileTopBar />
        <DemoBanner />
        <main className="flex-1 overflow-x-hidden pb-20 md:pb-8">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">{children}</div>
        </main>
      </div>
      <BottomNav />
      <MobileMenu />
    </div>
  );
}
