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

interface RamChartProps {
  data: TimestampedMetrics[];
  range?: MetricsRange;
  liveNow?: number;
  windowMs?: number;
}

export const RamChart = memo(function RamChart({
  data,
  range = "live",
  liveNow,
  windowMs = 180_000,
}: RamChartProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        timestamp: d.timestamp,
        ram: d.ramPercent,
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
          formatter={(value) => [`${Number(value).toFixed(1)}%`, "RAM"]}
        />
        <Area
          type="monotone"
          dataKey="ram"
          stroke="#b9a1e6"
          strokeWidth={2}
          fill="#b9a1e6"
          fillOpacity={0.12}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});
