import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: "cyan" | "emerald" | "amber" | "red" | "purple";
  showLabel?: boolean;
}

const gradientMap = {
  cyan: "bg-gradient-to-r from-cyan-500 to-cyan-300 shadow-[0_0_12px_-2px_rgba(34,211,238,0.5)]",
  emerald: "bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_12px_-2px_rgba(16,185,129,0.5)]",
  amber: "bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_12px_-2px_rgba(245,158,11,0.5)]",
  red: "bg-gradient-to-r from-red-500 to-red-300 shadow-[0_0_12px_-2px_rgba(239,68,68,0.5)]",
  purple: "bg-gradient-to-r from-violet-500 to-violet-300 shadow-[0_0_12px_-2px_rgba(167,139,250,0.5)]",
};

function getAutoGradient(percent: number): string {
  if (percent >= 90) return gradientMap.red;
  if (percent >= 70) return gradientMap.amber;
  return gradientMap.emerald;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  color,
  showLabel = false,
}: ProgressBarProps) {
  const percent = Math.min((value / max) * 100, 100);
  const barStyle = color ? gradientMap[color] : getAutoGradient(percent);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barStyle)}
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
