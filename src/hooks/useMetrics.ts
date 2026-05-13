import useSWR from "swr";
import type { ServerMetrics, TimestampedMetrics, ProcessInfo } from "@/types/server";
import type { MetricsRange } from "@/lib/metrics-archive";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

const defaultOpts = {
  revalidateOnFocus: false,
  errorRetryInterval: 5000,
  errorRetryCount: 60,
};

export function useServerMetrics(serverId: string, refreshInterval = 5000) {
  return useSWR<{ metrics: ServerMetrics }>(
    `/api/servers/${serverId}/metrics`,
    fetcher,
    {
      ...defaultOpts,
      dedupingInterval: Math.min(refreshInterval, 1000),
      refreshInterval,
    }
  );
}

export function useServerMetricsMap() {
  return useSWR<{ metrics: Record<string, ServerMetrics> }>(
    "/api/servers/metrics",
    fetcher,
    { ...defaultOpts, dedupingInterval: 1000, refreshInterval: 1000 }
  );
}

export function useServerHistory(
  serverId: string,
  range: MetricsRange = "live",
  refreshIntervalOverride?: number
) {
  const baseRefreshInterval =
    range === "live" ? 5000 : range === "24h" ? 60000 : 300000;
  const refreshInterval = refreshIntervalOverride ?? baseRefreshInterval;

  return useSWR<{ history: TimestampedMetrics[] }>(
    `/api/servers/${serverId}/history?range=${range}&limit=180`,
    fetcher,
    {
      ...defaultOpts,
      dedupingInterval: Math.min(refreshInterval, 1000),
      refreshInterval,
    }
  );
}

export function useServerProcesses(serverId: string) {
  return useSWR<{ processes: ProcessInfo[] }>(
    `/api/servers/${serverId}/processes`,
    fetcher,
    { ...defaultOpts, refreshInterval: 15000 }
  );
}
