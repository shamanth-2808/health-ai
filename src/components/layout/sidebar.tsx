"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-card/60 backdrop-blur-md md:flex">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
          <Activity className="h-5 w-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-base font-semibold tracking-tight">HealthAI</span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Health Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto scrollbar-thin p-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="truncate">{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-3">
        <div className="flex items-center justify-between rounded-md px-3 py-1.5">
          <span className="text-xs font-medium text-muted-foreground">Appearance</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
