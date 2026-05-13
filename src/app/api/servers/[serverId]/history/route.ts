import { NextResponse } from "next/server";
import { metricsStore } from "@/lib/metrics-store";
import {
  downsample,
  getArchivedMetrics,
  type MetricsRange,
} from "@/lib/metrics-archive";
import type { TimestampedMetrics } from "@/types/server";

function parseRange(value: string | null): MetricsRange {
  return value === "24h" || value === "7d" ? value : "live";
}

function mergeHistory(
  archived: TimestampedMetrics[],
  live: TimestampedMetrics[]
): TimestampedMetrics[] {
  const points = new Map<number, TimestampedMetrics>();
  for (const point of archived) points.set(point.timestamp, point);
  for (const point of live) points.set(point.timestamp, point);
  return [...points.values()].sort((a, b) => a.timestamp - b.timestamp);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  const { searchParams } = new URL(request.url);
  const range = parseRange(searchParams.get("range"));
  const limitParam = Number(searchParams.get("limit") || 180);
  const limit = Number.isFinite(limitParam) ? limitParam : 180;
  const liveHistory = metricsStore.getHistory(serverId, limit);
  const history =
    range === "live"
      ? downsample(liveHistory, limit)
      : downsample(
          mergeHistory(getArchivedMetrics(serverId, range), liveHistory),
          range === "24h" ? 720 : 1008
        );

  return NextResponse.json(
    { history, range },
    {
      headers: {
        "Cache-Control":
          range === "live"
            ? "private, no-store"
            : "private, max-age=60, stale-while-revalidate=120",
      },
    }
  );
}
