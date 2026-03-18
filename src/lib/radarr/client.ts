import { getRadarrConfig } from "@/lib/config";
import type {
  RadarrMovie,
  RadarrQualityProfile,
  RadarrRootFolder,
  RadarrQueueItem,
  RadarrHistoryRecord,
  RadarrCalendarItem,
  RadarrStatus,
  RadarrDiskSpace,
  RadarrLookupResult,
  RadarrRelease,
} from "@/types/radarr";

class RadarrClient {
  private get config() {
    return getRadarrConfig();
  }

  private async fetch<T>(path: string, init?: RequestInit): Promise<T> {
    const cfg = this.config;
    if (!cfg) throw new Error("Radarr not configured");

    const url = `${cfg.url}/api/v3${path}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        "X-Api-Key": cfg.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Radarr API error: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  async getStatus(): Promise<RadarrStatus> {
    return this.fetch<RadarrStatus>("/system/status");
  }

  async getMovies(): Promise<RadarrMovie[]> {
    return this.fetch<RadarrMovie[]>("/movie");
  }

  async getMovie(id: number): Promise<RadarrMovie> {
    return this.fetch<RadarrMovie>(`/movie/${id}`);
  }

  async addMovie(movie: Record<string, unknown>): Promise<RadarrMovie> {
    return this.fetch<RadarrMovie>("/movie", {
      method: "POST",
      body: JSON.stringify(movie),
    });
  }

  async updateMovie(id: number, movie: Record<string, unknown>): Promise<RadarrMovie> {
    return this.fetch<RadarrMovie>(`/movie/${id}`, {
      method: "PUT",
      body: JSON.stringify(movie),
    });
  }

  async deleteMovie(id: number, deleteFiles = false): Promise<void> {
    await this.fetch(`/movie/${id}?deleteFiles=${deleteFiles}`, {
      method: "DELETE",
    });
  }

  async lookupMovie(term: string): Promise<RadarrLookupResult[]> {
    return this.fetch<RadarrLookupResult[]>(
      `/movie/lookup?term=${encodeURIComponent(term)}`
    );
  }

  async getQueue(page = 1, pageSize = 20): Promise<{ page: number; pageSize: number; totalRecords: number; records: RadarrQueueItem[] }> {
    return this.fetch(`/queue?page=${page}&pageSize=${pageSize}&includeMovie=true`);
  }

  async deleteQueueItem(id: number, removeFromClient = true, blocklist = false): Promise<void> {
    await this.fetch(
      `/queue/${id}?removeFromClient=${removeFromClient}&blocklist=${blocklist}`,
      { method: "DELETE" }
    );
  }

  async getCalendar(start: string, end: string): Promise<RadarrCalendarItem[]> {
    return this.fetch<RadarrCalendarItem[]>(
      `/calendar?start=${start}&end=${end}`
    );
  }

  async getHistory(page = 1, pageSize = 20): Promise<{ page: number; pageSize: number; totalRecords: number; records: RadarrHistoryRecord[] }> {
    return this.fetch(
      `/history?page=${page}&pageSize=${pageSize}&sortKey=date&sortDirection=descending&includeMovie=true`
    );
  }

  async getQualityProfiles(): Promise<RadarrQualityProfile[]> {
    return this.fetch<RadarrQualityProfile[]>("/qualityprofile");
  }

  async getRootFolders(): Promise<RadarrRootFolder[]> {
    return this.fetch<RadarrRootFolder[]>("/rootfolder");
  }

  async getDiskSpace(): Promise<RadarrDiskSpace[]> {
    return this.fetch<RadarrDiskSpace[]>("/diskspace");
  }

  async command(name: string, movieId?: number): Promise<unknown> {
    const body: Record<string, unknown> = { name };
    if (movieId) body.movieIds = [movieId];
    return this.fetch("/command", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getReleases(movieId: number): Promise<RadarrRelease[]> {
    return this.fetch<RadarrRelease[]>(`/release?movieId=${movieId}`);
  }

  async grabRelease(guid: string, indexerId: number): Promise<void> {
    await this.fetch("/release", {
      method: "POST",
      body: JSON.stringify({ guid, indexerId }),
    });
  }

  isConfigured(): boolean {
    return !!this.config;
  }
}

export const radarrClient = new RadarrClient();
