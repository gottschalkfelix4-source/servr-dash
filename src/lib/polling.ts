import { getConfig } from "./config";
import { collectMetrics } from "./ssh/collect-metrics";
import { metricsStore } from "./metrics-store";
import type { ServerConfig } from "@/types/server";

const POLL_INTERVAL = 5000; // 5 seconds

class PollingScheduler {
  private started = false;
  private timers = new Map<string, ReturnType<typeof setInterval>>();

  start(): void {
    if (this.started) return;
    this.started = true;
    this.refresh();
  }

  refresh(): void {
    const config = getConfig();

    // Stop polling for removed servers
    for (const [serverId, timer] of this.timers) {
      if (!config.servers.find((s) => s.id === serverId)) {
        clearInterval(timer);
        this.timers.delete(serverId);
      }
    }

    // Start polling for new servers
    for (const server of config.servers) {
      if (!this.timers.has(server.id)) {
        this.pollServer(server);
        const timer = setInterval(() => this.pollServer(server), POLL_INTERVAL);
        this.timers.set(server.id, timer);
      }
    }
  }

  private async pollServer(server: ServerConfig): Promise<void> {
    try {
      const metrics = await collectMetrics(server);
      metricsStore.push(server.id, metrics);
    } catch (err) {
      console.error(`[Polling] Failed to collect metrics for ${server.name}:`, err instanceof Error ? err.message : err);
    }
  }

  stop(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
    this.started = false;
  }
}

// Use globalThis to survive HMR in dev mode
const globalKey = "__pollingScheduler__" as const;
export const pollingScheduler: PollingScheduler =
  (globalThis as Record<string, unknown>)[globalKey] as PollingScheduler ??
  ((globalThis as Record<string, unknown>)[globalKey] = new PollingScheduler());
