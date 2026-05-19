"use client";

import { memo, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { TimestampedMetrics } from "@/types/server";
import type { MetricsRange } from "@/lib/metrics-archive";
import {
  commonTooltipStyle,
  formatChartTime,
  formatTooltipTime,
} from "./chart-utils";

interface CpuChartProps {
  data: TimestampedMetrics[];
  range?: MetricsRange;
  liveNow?: number;
  windowMs?: number;
}

export const CpuChart = memo(function CpuChart({
  data,
  range = "live",
  liveNow,
  windowMs = 180_000,
}: CpuChartProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        timestamp: d.timestamp,
        cpu: d.cpu,
      })),
    [data]
  );

  const hasLiveWindow = range === "live" && typeof liveNow === "number";

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData}>
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
          formatter={(value) => [`${Number(value).toFixed(1)}%`, "CPU"]}
        />
        <Area
          type="monotone"
          dataKey="cpu"
          stroke="#78c6a3"
          strokeWidth={2}
          fill="#78c6a3"
          fillOpacity={0.12}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});
