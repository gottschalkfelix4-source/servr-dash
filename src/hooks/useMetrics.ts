import useSWR from "swr";
import type { ServerMetrics, TimestampedMetrics, ProcessInfo } from "@/types/server";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

const defaultOpts = {
  revalidateOnFocus: false,
  dedupingInterval: 3000,
  errorRetryInterval: 5000,
  errorRetryCount: 60,
};

export function useServerMetrics(serverId: string) {
  return useSWR<{ metrics: ServerMetrics }>(
    `/api/servers/${serverId}/metrics`,
    fetcher,
    { ...defaultOpts, refreshInterval: 5000 }
  );
}

export function useServerHistory(serverId: string) {
  return useSWR<{ history: TimestampedMetrics[] }>(
    `/api/servers/${serverId}/history`,
    fetcher,
    { ...defaultOpts, refreshInterval: 5000 }
  );
}

export function useServerProcesses(serverId: string) {
  return useSWR<{ processes: ProcessInfo[] }>(
    `/api/servers/${serverId}/processes`,
    fetcher,
    { ...defaultOpts, refreshInterval: 15000 }
  );
}
