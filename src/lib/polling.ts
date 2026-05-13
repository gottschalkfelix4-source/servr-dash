import { getConfig } from "./config";
import { collectMetrics } from "./ssh/collect-metrics";
import { metricsStore } from "./metrics-store";
import { isLocalMetricsServer } from "./server-exec";
import type { ServerConfig } from "@/types/server";

const SSH_POLL_INTERVAL = 5000;
const LOCAL_POLL_INTERVAL = 1000;

function getPollInterval(server: ServerConfig): number {
  return isLocalMetricsServer(server) ? LOCAL_POLL_INTERVAL : SSH_POLL_INTERVAL;
}

class PollingScheduler {
  private started = false;
  private timers = new Map<string, ReturnType<typeof setInterval>>();
  private timerIntervals = new Map<string, number>();
  private inFlight = new Set<string>();

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
        this.timerIntervals.delete(serverId);
        this.inFlight.delete(serverId);
      }
    }

    // Start or retune polling for servers.
    for (const server of config.servers) {
      const interval = getPollInterval(server);
      const currentInterval = this.timerIntervals.get(server.id);

      if (!this.timers.has(server.id) || currentInterval !== interval) {
        const existingTimer = this.timers.get(server.id);
        if (existingTimer) {
          clearInterval(existingTimer);
        }

        void this.pollServer(server);
        const timer = setInterval(() => {
          void this.pollServerById(server.id);
        }, interval);
        this.timers.set(server.id, timer);
        this.timerIntervals.set(server.id, interval);
      }
    }
  }

  private async pollServerById(serverId: string): Promise<void> {
    const server = getConfig().servers.find((item) => item.id === serverId);
    if (server) {
      await this.pollServer(server);
    }
  }

  private async pollServer(server: ServerConfig): Promise<void> {
    if (this.inFlight.has(server.id)) return;
    this.inFlight.add(server.id);

    try {
      const metrics = await collectMetrics(server);
      metricsStore.push(server.id, metrics);
    } catch (err) {
      console.error(`[Polling] Failed to collect metrics for ${server.name}:`, err instanceof Error ? err.message : err);
    } finally {
      this.inFlight.delete(server.id);
    }
  }

  stop(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
    this.timerIntervals.clear();
    this.inFlight.clear();
    this.started = false;
  }
}

// Use globalThis to survive HMR in dev mode
const globalKey = "__pollingScheduler__" as const;
export const pollingScheduler: PollingScheduler =
  (globalThis as Record<string, unknown>)[globalKey] as PollingScheduler ??
  ((globalThis as Record<string, unknown>)[globalKey] = new PollingScheduler());
