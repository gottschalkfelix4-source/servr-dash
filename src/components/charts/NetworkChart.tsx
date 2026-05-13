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
import { formatBytes } from "@/lib/utils";
import type { TimestampedMetrics } from "@/types/server";
import type { MetricsRange } from "@/lib/metrics-archive";
import {
  commonTooltipStyle,
  formatChartTime,
  formatTooltipTime,
} from "./chart-utils";

interface NetworkChartProps {
  data: TimestampedMetrics[];
  range?: MetricsRange;
  liveNow?: number;
  windowMs?: number;
}

export const NetworkChart = memo(function NetworkChart({
  data,
  range = "live",
  liveNow,
  windowMs = 180_000,
}: NetworkChartProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        timestamp: d.timestamp,
        rx: d.rxBytesPerSec,
        tx: d.txBytesPerSec,
      })),
    [data]
  );

  const hasLiveWindow = range === "live" && typeof liveNow === "number";

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
          tick={{ fontSize: 10, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatBytes(v) + "/s"}
          width={70}
        />
        <Tooltip
          contentStyle={{
            ...commonTooltipStyle,
            boxShadow: "0 0 20px -5px rgba(16, 185, 129, 0.15)",
          }}
          labelFormatter={(value) => formatTooltipTime(Number(value), range)}
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
          connectNulls
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="tx"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
          filter="url(#netGlowAmber)"
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});
