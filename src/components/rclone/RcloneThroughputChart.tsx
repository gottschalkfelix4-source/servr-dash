"use client";

import { memo, useMemo } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBytes } from "@/lib/utils";
import type { RcloneHistoryPoint } from "@/types/rclone";

const tooltipStyle = {
  backgroundColor: "rgba(15, 23, 42, 0.9)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(148, 163, 184, 0.1)",
  borderRadius: "12px",
  color: "#e2e8f0",
};

export const RcloneThroughputChart = memo(function RcloneThroughputChart({
  data,
}: {
  data: RcloneHistoryPoint[];
}) {
  const chartData = useMemo(
    () =>
      data.map((point) => ({
        time: new Date(point.timestamp).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        speed: point.speed,
      })),
    [data]
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData}>
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
          tickFormatter={(value) => `${formatBytes(value)}/s`}
          width={72}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [`${formatBytes(Number(value))}/s`, "Durchsatz"]}
        />
        <Line
          type="monotone"
          dataKey="speed"
          stroke="#22d3ee"
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});
