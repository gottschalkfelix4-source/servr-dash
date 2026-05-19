import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const variantStyles: Record<BadgeVariant, string> = {
  default: "border-border bg-card-hover text-muted",
  success: "border-accent-emerald/25 bg-accent-emerald/10 text-accent-emerald",
  warning: "border-accent-amber/25 bg-accent-amber/10 text-accent-amber",
  danger: "border-accent-red/25 bg-accent-red/10 text-accent-red",
  info: "border-accent-cyan/25 bg-accent-cyan/10 text-accent-cyan",
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
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
