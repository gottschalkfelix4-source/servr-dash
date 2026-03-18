import useSWR from "swr";
import type {
  ABBDevice,
  ABBTask,
  ABBLogEntry,
  ABBOverview,
} from "@/types/synology";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

const defaultOpts = { revalidateOnFocus: false, dedupingInterval: 5000 };

export function useSynologyStatus() {
  return useSWR<{ success: boolean; version?: string }>(
    "/api/synology/status",
    fetcher,
    { ...defaultOpts, refreshInterval: 60000 }
  );
}

export function useSynologyOverview() {
  return useSWR<ABBOverview>("/api/synology/overview", fetcher, {
    ...defaultOpts,
    refreshInterval: 30000,
  });
}

export function useSynologyDevices() {
  return useSWR<ABBDevice[]>("/api/synology/devices", fetcher, {
    ...defaultOpts,
    refreshInterval: 30000,
  });
}

export function useSynologyTasks() {
  return useSWR<ABBTask[]>("/api/synology/tasks", fetcher, {
    ...defaultOpts,
    refreshInterval: 30000,
  });
}

export function useSynologyLogs(limit = 50) {
  return useSWR<ABBLogEntry[]>(
    `/api/synology/logs?limit=${limit}`,
    fetcher,
    { ...defaultOpts, refreshInterval: 30000 }
  );
}
