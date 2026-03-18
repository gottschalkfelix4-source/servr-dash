import useSWR from "swr";
import type { PlexServerStatus, PlexLibrary, PlexSession, PlexUser } from "@/types/plex";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

const defaultOpts = { revalidateOnFocus: false, dedupingInterval: 5000 };

export function usePlexStatus() {
  return useSWR<PlexServerStatus>("/api/plex/status", fetcher, {
    ...defaultOpts,
    refreshInterval: 15000,
  });
}

export function usePlexLibraries() {
  return useSWR<{ libraries: PlexLibrary[] }>("/api/plex/libraries", fetcher, {
    ...defaultOpts,
    refreshInterval: 60000,
  });
}

export function usePlexSessions() {
  return useSWR<{ sessions: PlexSession[] }>("/api/plex/sessions", fetcher, {
    ...defaultOpts,
    refreshInterval: 10000,
  });
}

export function usePlexUsers() {
  return useSWR<{ users: PlexUser[] }>("/api/plex/users", fetcher, {
    ...defaultOpts,
    refreshInterval: 60000,
  });
}
