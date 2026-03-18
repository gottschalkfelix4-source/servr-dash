"use client";

import { memo, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { TimestampedMetrics } from "@/types/server";

interface CpuChartProps {
  data: TimestampedMetrics[];
}

const tooltipStyle = {
  backgroundColor: "rgba(15, 23, 42, 0.9)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(148, 163, 184, 0.1)",
  borderRadius: "12px",
  color: "#e2e8f0",
  boxShadow: "0 0 20px -5px rgba(34, 211, 238, 0.2)",
};

export const CpuChart = memo(function CpuChart({ data }: CpuChartProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        time: new Date(d.timestamp).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        cpu: d.cpu,
      })),
    [data]
  );

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
          <filter id="cpuGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
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
          contentStyle={tooltipStyle}
          formatter={(value) => [`${Number(value).toFixed(1)}%`, "CPU"]}
        />
        <Area
          type="monotone"
          dataKey="cpu"
          stroke="#22d3ee"
          strokeWidth={2}
          fill="url(#cpuGradient)"
          filter="url(#cpuGlow)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});
