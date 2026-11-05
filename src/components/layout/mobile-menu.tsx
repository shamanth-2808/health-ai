"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function MobileMenu() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="fixed right-4 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-lg border bg-card shadow-sm md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 max-w-[80vw] overflow-y-auto border-l bg-card p-4 shadow-lg animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-bold">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-md p-1 hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
