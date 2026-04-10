import useSWR from "swr";
import type {
  RcloneHistoryPoint,
  RcloneMountStatus,
  RcloneOverview,
  RcloneProfileStatus,
  RcloneTransferJob,
} from "@/types/rclone";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status}`);
  }
  return response.json();
};

const defaultOptions = {
  revalidateOnFocus: false,
  dedupingInterval: 3000,
  errorRetryInterval: 5000,
};

export function useRcloneOverview() {
  return useSWR<{ overview: RcloneOverview }>("/api/rclone/overview", fetcher, {
    ...defaultOptions,
    refreshInterval: 10000,
  });
}

export function useRcloneProfiles() {
  return useSWR<{ profiles: RcloneProfileStatus[] }>(
    "/api/rclone/profiles",
    fetcher,
    {
      ...defaultOptions,
      refreshInterval: 10000,
    }
  );
}

export function useRcloneMounts() {
  return useSWR<{ mounts: RcloneMountStatus[] }>("/api/rclone/mounts", fetcher, {
    ...defaultOptions,
    refreshInterval: 10000,
  });
}

export function useRcloneTransfers() {
  return useSWR<{ active: RcloneTransferJob[]; recent: RcloneTransferJob[] }>(
    "/api/rclone/transfers",
    fetcher,
    {
      ...defaultOptions,
      refreshInterval: 8000,
    }
  );
}

export function useRcloneHistory(profileId?: string) {
  const key = profileId ? `/api/rclone/history/${profileId}` : null;
  return useSWR<{ history: RcloneHistoryPoint[] }>(key, fetcher, {
    ...defaultOptions,
    refreshInterval: 10000,
  });
}
