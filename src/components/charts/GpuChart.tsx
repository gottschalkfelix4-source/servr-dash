"use client";

import { memo, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import type { TimestampedMetrics } from "@/types/server";
import type { MetricsRange } from "@/lib/metrics-archive";
import {
  commonTooltipStyle,
  formatChartTime,
  formatTooltipTime,
} from "./chart-utils";

interface GpuChartProps {
  data: TimestampedMetrics[];
  range?: MetricsRange;
  liveNow?: number;
  windowMs?: number;
}

export const GpuChart = memo(function GpuChart({
  data,
  range = "live",
  liveNow,
  windowMs = 180_000,
}: GpuChartProps) {
  const chartData = useMemo(
    () =>
      data
        .filter(
          (d) =>
            typeof d.gpuPercent === "number" ||
            typeof d.gpuMemoryPercent === "number"
        )
        .map((d) => ({
          timestamp: d.timestamp,
          gpu: d.gpuPercent ?? 0,
          memory: d.gpuMemoryPercent ?? 0,
        })),
    [data]
  );

  const hasLiveWindow = range === "live" && typeof liveNow === "number";

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <CartesianGrid stroke="#2a2a2e" vertical={false} />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={hasLiveWindow ? [liveNow - windowMs, liveNow] : ["dataMin", "dataMax"]}
          allowDataOverflow={hasLiveWindow}
          tick={{ fontSize: 10, fill: "#9b9ba3" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={28}
          tickFormatter={(value) => formatChartTime(Number(value), range)}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: "#9b9ba3" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
          width={40}
        />
        <Tooltip
          contentStyle={commonTooltipStyle}
          labelFormatter={(value) => formatTooltipTime(Number(value), range)}
          formatter={(value, name) => [
            `${Number(value).toFixed(1)}%`,
            name === "gpu" ? "GPU" : "VRAM",
          ]}
        />
        <Legend
          formatter={(value) => (value === "gpu" ? "GPU" : "VRAM")}
          wrapperStyle={{ fontSize: 12, color: "#9b9ba3" }}
        />
        <Line
          type="monotone"
          dataKey="gpu"
          stroke="#78c6a3"
          strokeWidth={2}
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="memory"
          stroke="#b9a1e6"
          strokeWidth={2}
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});
