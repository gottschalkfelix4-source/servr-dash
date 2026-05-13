import type { ServerMetrics, TimestampedMetrics } from "@/types/server";
import { recordMetricsPoint } from "@/lib/metrics-archive";

const BUFFER_SIZE = 180; // 180 data points (~15 minutes at 5s interval)

class RingBuffer {
  private buffer: TimestampedMetrics[] = [];
  private head = 0;
  private count = 0;

  push(item: TimestampedMetrics): void {
    if (this.count < BUFFER_SIZE) {
      this.buffer.push(item);
      this.count++;
    } else {
      this.buffer[this.head] = item;
    }
    this.head = (this.head + 1) % BUFFER_SIZE;
  }

  getAll(limit = BUFFER_SIZE): TimestampedMetrics[] {
    const boundedLimit = Math.max(1, Math.min(limit, BUFFER_SIZE));
    const data =
      this.count < BUFFER_SIZE
        ? [...this.buffer]
        : [
            ...this.buffer.slice(this.head),
            ...this.buffer.slice(0, this.head),
          ];

    return data.slice(-boundedLimit);
  }

  getLatest(): TimestampedMetrics | undefined {
    if (this.count === 0) return undefined;
    const index = (this.head - 1 + BUFFER_SIZE) % BUFFER_SIZE;
    return this.buffer[index];
  }
}

class MetricsStore {
  private latestMetrics = new Map<string, ServerMetrics>();
  private historyBuffers = new Map<string, RingBuffer>();

  push(serverId: string, metrics: ServerMetrics): void {
    this.latestMetrics.set(serverId, metrics);

    if (!this.historyBuffers.has(serverId)) {
      this.historyBuffers.set(serverId, new RingBuffer());
    }

    const gpus = metrics.gpus || [];
    const gpuCount = gpus.length;
    const gpuPercent =
      gpuCount > 0
        ? gpus.reduce((sum, gpu) => sum + gpu.utilization, 0) / gpuCount
        : undefined;
    const gpuMemoryPercent =
      gpuCount > 0
        ? gpus.reduce((sum, gpu) => sum + gpu.memoryPercent, 0) / gpuCount
        : undefined;
    const gpuTemperatures = gpus
      .map((gpu) => gpu.temperature)
      .filter((value): value is number => typeof value === "number");
    const gpuTemperature =
      gpuTemperatures.length > 0
        ? gpuTemperatures.reduce((sum, value) => sum + value, 0) /
          gpuTemperatures.length
        : undefined;

    const point = {
      cpu: metrics.cpu,
      ramPercent: metrics.ram.percent,
      rxBytesPerSec: metrics.network[0]?.rxBytesPerSec || 0,
      txBytesPerSec: metrics.network[0]?.txBytesPerSec || 0,
      gpuPercent,
      gpuMemoryPercent,
      gpuTemperature,
      timestamp: metrics.timestamp,
    };

    this.historyBuffers.get(serverId)!.push(point);

    try {
      recordMetricsPoint(serverId, point);
    } catch (err) {
      console.error(
        `[Metrics] Failed to archive point for ${serverId}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  getLatest(serverId: string): ServerMetrics | undefined {
    return this.latestMetrics.get(serverId);
  }

  getLatestForAll(): Record<string, ServerMetrics> {
    return Object.fromEntries(this.latestMetrics.entries());
  }

  getHistory(serverId: string, limit?: number): TimestampedMetrics[] {
    return this.historyBuffers.get(serverId)?.getAll(limit) || [];
  }

  getHistoryLatest(serverId: string): TimestampedMetrics | undefined {
    return this.historyBuffers.get(serverId)?.getLatest();
  }

  has(serverId: string): boolean {
    return this.latestMetrics.has(serverId);
  }
}

// Use globalThis to survive HMR in dev mode
const globalKey = "__metricsStore__" as const;
export const metricsStore: MetricsStore =
  (globalThis as Record<string, unknown>)[globalKey] as MetricsStore ??
  ((globalThis as Record<string, unknown>)[globalKey] = new MetricsStore());
