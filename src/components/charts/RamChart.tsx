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
        <defs>
          <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
          </linearGradient>
          <filter id="ramGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={hasLiveWindow ? [liveNow - windowMs, liveNow] : ["dataMin", "dataMax"]}
          allowDataOverflow={hasLiveWindow}
          tick={{ fontSize: 10, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={28}
          tickFormatter={(value) => formatChartTime(Number(value), range)}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
          width={40}
        />
        <Tooltip
          contentStyle={{
            ...commonTooltipStyle,
            boxShadow: "0 0 20px -5px rgba(167, 139, 250, 0.2)",
          }}
          labelFormatter={(value) => formatTooltipTime(Number(value), range)}
          formatter={(value) => [`${Number(value).toFixed(1)}%`, "RAM"]}
        />
        <Area
          type="monotone"
          dataKey="ram"
          stroke="#a78bfa"
          strokeWidth={2}
          fill="url(#ramGradient)"
          filter="url(#ramGlow)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});
