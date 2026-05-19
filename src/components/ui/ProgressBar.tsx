import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: "cyan" | "emerald" | "amber" | "red" | "purple";
  showLabel?: boolean;
}

const colorMap = {
  cyan: "bg-accent-cyan",
  emerald: "bg-accent-emerald",
  amber: "bg-accent-amber",
  red: "bg-accent-red",
  purple: "bg-accent-purple",
};

function getAutoColor(percent: number): string {
  if (percent >= 90) return colorMap.red;
  if (percent >= 70) return colorMap.amber;
  return colorMap.emerald;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  color,
  showLabel = false,
}: ProgressBarProps) {
  const percent = Math.min((value / max) * 100, 100);
  const barStyle = color ? colorMap[color] : getAutoColor(percent);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-sm bg-white/[0.06]">
        <div
          className={cn("h-full rounded-sm transition-[width] duration-300", barStyle)}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted w-12 text-right font-mono">
          {percent.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
