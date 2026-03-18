import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "cyan" | "emerald" | "purple" | "amber";
}

export function Card({ children, className, hover = false, glow }: CardProps) {
  const glowClass = glow ? `glow-${glow}` : "";

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card backdrop-blur-xl p-5 transition-all duration-300",
        hover && "hover:bg-card-hover hover:border-border-glow cursor-pointer hover:shadow-[0_0_30px_-10px_rgba(34,211,238,0.15)]",
        glowClass,
        "gradient-border",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-4 pb-3 border-b border-border", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn("text-sm font-medium text-muted", className)}>
      {children}
    </h3>
  );
}
