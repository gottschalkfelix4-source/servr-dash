import { cn } from "@/lib/utils";

type Status = "online" | "offline" | "warning" | "unknown";

const statusStyles: Record<Status, string> = {
  online: "bg-accent-emerald",
  offline: "bg-accent-red",
  warning: "bg-accent-amber",
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
        "inline-block h-2 w-2 rounded-full",
        statusStyles[status],
        className
      )}
    />
  );
}
