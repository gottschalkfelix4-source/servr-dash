import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "cyan" | "emerald" | "purple" | "amber";
}

export function Card({ children, className, hover = false, glow }: CardProps) {
  const accentClass = glow ? "border-border-glow" : "";

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 transition-colors duration-150 sm:p-5",
        hover && "cursor-pointer hover:border-border-glow hover:bg-card-hover",
        accentClass,
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
    <div className={cn("mb-4 flex items-center justify-between border-b border-border pb-3", className)}>
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
    <h3 className={cn("text-sm font-semibold text-foreground", className)}>
      {children}
    </h3>
  );
}
