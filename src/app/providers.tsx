"use client";

import * as React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { DataStoreProvider } from "@/lib/store/data-store";
import { AuthProvider } from "@/lib/auth/auth-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataStoreProvider>{children}</DataStoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
