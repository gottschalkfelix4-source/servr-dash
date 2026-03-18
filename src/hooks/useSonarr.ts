import useSWR, { mutate } from "swr";
import type {
  SonarrStatus,
  SonarrSeries,
  SonarrEpisode,
  SonarrQueueItem,
  SonarrCalendarItem,
  SonarrQualityProfile,
  SonarrRootFolder,
  SonarrLookupResult,
} from "@/types/sonarr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

const defaultOpts = { revalidateOnFocus: false, dedupingInterval: 5000 };

// ── SWR Hooks ──────────────────────────────────────────────

export function useSonarrStatus() {
  return useSWR<SonarrStatus>("/api/sonarr/status", fetcher, {
    ...defaultOpts,
    refreshInterval: 30000,
  });
}

export function useSonarrSeries() {
  return useSWR<SonarrSeries[]>("/api/sonarr/series", fetcher, {
    ...defaultOpts,
    refreshInterval: 30000,
  });
}

export function useSonarrSerie(id: number | undefined) {
  return useSWR<SonarrSeries>(
    id ? `/api/sonarr/series/${id}` : null,
    fetcher,
    defaultOpts
  );
}

export function useSonarrEpisodes(seriesId: number | undefined) {
  return useSWR<SonarrEpisode[]>(
    seriesId ? `/api/sonarr/series/${seriesId}/episodes` : null,
    fetcher,
    defaultOpts
  );
}

export function useSonarrQueue() {
  return useSWR<{
    page: number;
    pageSize: number;
    totalRecords: number;
    records: SonarrQueueItem[];
  }>("/api/sonarr/queue", fetcher, {
    ...defaultOpts,
    refreshInterval: 10000,
  });
}

export function useSonarrCalendar(start?: string, end?: string) {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const qs = params.toString();

  return useSWR<SonarrCalendarItem[]>(
    `/api/sonarr/calendar${qs ? `?${qs}` : ""}`,
    fetcher,
    { ...defaultOpts, refreshInterval: 60000 }
  );
}

export function useSonarrProfiles() {
  return useSWR<SonarrQualityProfile[]>("/api/sonarr/profiles", fetcher, {
    ...defaultOpts,
    refreshInterval: 0,
  });
}

export function useSonarrRootFolders() {
  return useSWR<SonarrRootFolder[]>("/api/sonarr/rootfolders", fetcher, {
    ...defaultOpts,
    refreshInterval: 0,
  });
}

// ── Action functions ───────────────────────────────────────

export async function addSeries(data: Record<string, unknown>) {
  const res = await fetch("/api/sonarr/series", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const result = await res.json();
  mutate("/api/sonarr/series");
  return result;
}

export async function deleteSeries(id: number, deleteFiles = false) {
  const res = await fetch(
    `/api/sonarr/series/${id}?deleteFiles=${deleteFiles}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error(`${res.status}`);
  mutate("/api/sonarr/series");
  return res.json();
}

export async function searchSeries(id: number) {
  const res = await fetch(`/api/sonarr/series/${id}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "SeriesSearch" }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function refreshSeries(id: number) {
  const res = await fetch(`/api/sonarr/series/${id}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "RefreshSeries" }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  mutate(`/api/sonarr/series/${id}`);
  return res.json();
}

export async function lookupSeries(term: string): Promise<SonarrLookupResult[]> {
  const res = await fetch(
    `/api/sonarr/series/lookup?term=${encodeURIComponent(term)}`
  );
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function deleteQueueItem(id: number) {
  const res = await fetch(`/api/sonarr/queue?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`${res.status}`);
  mutate("/api/sonarr/queue");
  return res.json();
}
