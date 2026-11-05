"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity } from "lucide-react";
import { BOTTOM_NAV_ITEMS } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/85 backdrop-blur-md md:hidden">
      <div className="flex items-stretch justify-around px-1 py-1">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-md py-1.5 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Mobile top bar with brand. */
export function MobileTopBar() {
  return (
    <header className="flex h-14 items-center gap-2.5 border-b bg-card/60 px-4 backdrop-blur-md md:hidden">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
        <Activity className="h-5 w-5" />
      </div>
      <span className="text-base font-semibold tracking-tight">HealthAI</span>
    </header>
  );
}
