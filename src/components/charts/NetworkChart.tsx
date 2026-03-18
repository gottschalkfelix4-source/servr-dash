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
} from "recharts";
import { formatBytes } from "@/lib/utils";
import type { TimestampedMetrics } from "@/types/server";

interface NetworkChartProps {
  data: TimestampedMetrics[];
}

const tooltipStyle = {
  backgroundColor: "rgba(15, 23, 42, 0.9)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(148, 163, 184, 0.1)",
  borderRadius: "12px",
  color: "#e2e8f0",
  boxShadow: "0 0 20px -5px rgba(16, 185, 129, 0.15)",
};

export const NetworkChart = memo(function NetworkChart({ data }: NetworkChartProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        time: new Date(d.timestamp).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        rx: d.rxBytesPerSec,
        tx: d.txBytesPerSec,
      })),
    [data]
  );

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <defs>
          <filter id="netGlowGreen">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="netGlowAmber">
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
          tick={{ fontSize: 10, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatBytes(v) + "/s"}
          width={70}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value, name) => [
            `${formatBytes(Number(value))}/s`,
            name === "rx" ? "Download" : "Upload",
          ]}
        />
        <Legend
          formatter={(value) => (value === "rx" ? "Download" : "Upload")}
          wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
        />
        <Line
          type="monotone"
          dataKey="rx"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          filter="url(#netGlowGreen)"
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="tx"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
          filter="url(#netGlowAmber)"
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});
