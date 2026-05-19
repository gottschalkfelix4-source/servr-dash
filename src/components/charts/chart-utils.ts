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
  backgroundColor: "#171719",
  border: "1px solid #2a2a2e",
  borderRadius: "8px",
  color: "#f1f1f1",
};
