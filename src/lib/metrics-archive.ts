import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import type { TimestampedMetrics } from "@/types/server";

export type MetricsRange = "live" | "24h" | "7d";

const ARCHIVE_DIR = join(process.cwd(), "config", "metrics-history");
const RETENTION_MS = 8 * 24 * 60 * 60 * 1000;
const ARCHIVE_INTERVAL_MS = 60_000;
const MAX_POINTS: Record<MetricsRange, number> = {
  live: 180,
  "24h": 720,
  "7d": 1008,
};

const cache = new Map<string, TimestampedMetrics[]>();
const lastArchivedAt = new Map<string, number>();

function getPath(serverId: string): string {
  const safeId = serverId.replace(/[^a-zA-Z0-9_.-]/g, "_");
  return join(ARCHIVE_DIR, `${safeId}.json`);
}

function load(serverId: string): TimestampedMetrics[] {
  const cached = cache.get(serverId);
  if (cached) return cached;

  const path = getPath(serverId);
  if (!existsSync(path)) {
    cache.set(serverId, []);
    return [];
  }

  try {
    const data = JSON.parse(readFileSync(path, "utf-8")) as TimestampedMetrics[];
    cache.set(serverId, Array.isArray(data) ? data : []);
    return cache.get(serverId)!;
  } catch {
    cache.set(serverId, []);
    return [];
  }
}

function save(serverId: string, points: TimestampedMetrics[]): void {
  const path = getPath(serverId);
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(points), "utf-8");
}

export function recordMetricsPoint(
  serverId: string,
  point: TimestampedMetrics
): void {
  const last = lastArchivedAt.get(serverId) || 0;
  if (point.timestamp - last < ARCHIVE_INTERVAL_MS) return;

  const minTimestamp = point.timestamp - RETENTION_MS;
  const points = load(serverId)
    .filter((item) => item.timestamp >= minTimestamp)
    .concat(point);

  cache.set(serverId, points);
  lastArchivedAt.set(serverId, point.timestamp);
  save(serverId, points);
}

export function getArchivedMetrics(
  serverId: string,
  range: Exclude<MetricsRange, "live">
): TimestampedMetrics[] {
  const now = Date.now();
  const from =
    range === "24h"
      ? now - 24 * 60 * 60 * 1000
      : now - 7 * 24 * 60 * 60 * 1000;

  return downsample(
    load(serverId).filter((point) => point.timestamp >= from),
    MAX_POINTS[range]
  );
}

export function downsample<T>(points: T[], maxPoints: number): T[] {
  if (points.length <= maxPoints) return points;
  const stride = Math.ceil(points.length / maxPoints);
  return points.filter((_, index) => index % stride === 0).slice(-maxPoints);
}
