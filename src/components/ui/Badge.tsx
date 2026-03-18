import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-border text-foreground",
  success: "bg-accent-emerald/15 text-accent-emerald shadow-[0_0_10px_-3px_rgba(16,185,129,0.3)]",
  warning: "bg-accent-amber/15 text-accent-amber shadow-[0_0_10px_-3px_rgba(245,158,11,0.3)]",
  danger: "bg-accent-red/15 text-accent-red shadow-[0_0_10px_-3px_rgba(239,68,68,0.3)]",
  info: "bg-accent-cyan/15 text-accent-cyan shadow-[0_0_10px_-3px_rgba(34,211,238,0.3)]",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border border-white/5",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
