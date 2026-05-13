import type { MetricsRange } from "@/lib/metrics-archive";

export function formatChartTime(timestamp: number, range: MetricsRange): string {
  const date = new Date(timestamp);
  if (range === "7d") {
    return date.toLocaleDateString("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  }

  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: range === "live" ? "2-digit" : undefined,
  });
}

export function formatTooltipTime(timestamp: number, range: MetricsRange): string {
  const date = new Date(timestamp);
  return range === "live"
    ? date.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : date.toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export const commonTooltipStyle = {
  backgroundColor: "rgba(15, 23, 42, 0.92)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(148, 163, 184, 0.14)",
  borderRadius: "10px",
  color: "#e2e8f0",
};
