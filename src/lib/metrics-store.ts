import type { ServerMetrics, TimestampedMetrics } from "@/types/server";

const BUFFER_SIZE = 60; // 60 data points (~5 minutes at 5s interval)

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

  getAll(): TimestampedMetrics[] {
    if (this.count < BUFFER_SIZE) {
      return [...this.buffer];
    }
    // Return in chronological order
    return [
      ...this.buffer.slice(this.head),
      ...this.buffer.slice(0, this.head),
    ];
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

    this.historyBuffers.get(serverId)!.push({
      cpu: metrics.cpu,
      ramPercent: metrics.ram.percent,
      rxBytesPerSec: metrics.network[0]?.rxBytesPerSec || 0,
      txBytesPerSec: metrics.network[0]?.txBytesPerSec || 0,
      timestamp: metrics.timestamp,
    });
  }

  getLatest(serverId: string): ServerMetrics | undefined {
    return this.latestMetrics.get(serverId);
  }

  getHistory(serverId: string): TimestampedMetrics[] {
    return this.historyBuffers.get(serverId)?.getAll() || [];
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
