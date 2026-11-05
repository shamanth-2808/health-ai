import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
