import { cn } from "@/lib/utils";

type Status = "online" | "offline" | "warning" | "unknown";

const statusStyles: Record<Status, string> = {
  online: "bg-accent-emerald shadow-[0_0_8px_2px_rgba(16,185,129,0.5)] animate-pulse-glow",
  offline: "bg-accent-red shadow-[0_0_8px_2px_rgba(239,68,68,0.4)]",
  warning: "bg-accent-amber shadow-[0_0_8px_2px_rgba(245,158,11,0.4)]",
  unknown: "bg-muted/50",
};

interface StatusDotProps {
  status: Status;
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full",
        statusStyles[status],
        className
      )}
    />
  );
}
