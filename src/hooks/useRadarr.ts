import useSWR, { mutate } from "swr";
import type {
  RadarrStatus,
  RadarrMovie,
  RadarrQueueItem,
  RadarrCalendarItem,
  RadarrQualityProfile,
  RadarrRootFolder,
  RadarrLookupResult,
} from "@/types/radarr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

const defaultOpts = { revalidateOnFocus: false, dedupingInterval: 5000 };

export function useRadarrStatus() {
  return useSWR<RadarrStatus>("/api/radarr/status", fetcher, {
    ...defaultOpts,
    refreshInterval: 30000,
  });
}

export function useRadarrMovies() {
  return useSWR<RadarrMovie[]>("/api/radarr/movies", fetcher, {
    ...defaultOpts,
    refreshInterval: 30000,
  });
}

export function useRadarrMovie(id: number | undefined) {
  return useSWR<RadarrMovie>(
    id ? `/api/radarr/movies/${id}` : null,
    fetcher,
    defaultOpts
  );
}

export function useRadarrQueue() {
  return useSWR<{
    page: number;
    pageSize: number;
    totalRecords: number;
    records: RadarrQueueItem[];
  }>("/api/radarr/queue", fetcher, {
    ...defaultOpts,
    refreshInterval: 10000,
  });
}

export function useRadarrCalendar(start?: string, end?: string) {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const qs = params.toString();

  return useSWR<RadarrCalendarItem[]>(
    `/api/radarr/calendar${qs ? `?${qs}` : ""}`,
    fetcher,
    {
      ...defaultOpts,
      refreshInterval: 60000,
    }
  );
}

export function useRadarrProfiles() {
  return useSWR<RadarrQualityProfile[]>("/api/radarr/profiles", fetcher, {
    ...defaultOpts,
    refreshInterval: 0,
  });
}

export function useRadarrRootFolders() {
  return useSWR<RadarrRootFolder[]>("/api/radarr/rootfolders", fetcher, {
    ...defaultOpts,
    refreshInterval: 0,
  });
}

// --- Action functions ---

export async function addMovie(data: Record<string, unknown>) {
  const res = await fetch("/api/radarr/movies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const movie = await res.json();
  mutate("/api/radarr/movies");
  return movie;
}

export async function deleteMovie(id: number, deleteFiles = false) {
  const res = await fetch(
    `/api/radarr/movies/${id}?deleteFiles=${deleteFiles}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error(`${res.status}`);
  mutate("/api/radarr/movies");
}

export async function searchMovie(id: number) {
  const res = await fetch(`/api/radarr/movies/${id}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "MoviesSearch" }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function refreshMovie(id: number) {
  const res = await fetch(`/api/radarr/movies/${id}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "RefreshMovie" }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  mutate(`/api/radarr/movies/${id}`);
  return res.json();
}

export async function lookupMovies(term: string): Promise<RadarrLookupResult[]> {
  const res = await fetch(
    `/api/radarr/movies/lookup?term=${encodeURIComponent(term)}`
  );
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function fetchReleases(movieId: number) {
  const res = await fetch(`/api/radarr/movies/${movieId}/releases`);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function grabRelease(guid: string, indexerId: number) {
  const res = await fetch(`/api/radarr/movies/0/releases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guid, indexerId }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  mutate("/api/radarr/queue");
  return res.json();
}

export async function deleteQueueItem(id: number) {
  const res = await fetch(`/api/radarr/queue?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`${res.status}`);
  mutate("/api/radarr/queue");
}
