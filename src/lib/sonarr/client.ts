import { getSonarrConfig } from "@/lib/config";
import type {
  SonarrSeries,
  SonarrEpisode,
  SonarrQualityProfile,
  SonarrRootFolder,
  SonarrQueueItem,
  SonarrHistoryRecord,
  SonarrCalendarItem,
  SonarrStatus,
  SonarrDiskSpace,
  SonarrLookupResult,
} from "@/types/sonarr";

class SonarrClient {
  private get config() {
    return getSonarrConfig();
  }

  private async fetch<T>(path: string, init?: RequestInit): Promise<T> {
    const cfg = this.config;
    if (!cfg) throw new Error("Sonarr not configured");

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
      throw new Error(`Sonarr API error: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  async getStatus(): Promise<SonarrStatus> {
    return this.fetch<SonarrStatus>("/system/status");
  }

  async getSeries(): Promise<SonarrSeries[]> {
    return this.fetch<SonarrSeries[]>("/series");
  }

  async getSerie(id: number): Promise<SonarrSeries> {
    return this.fetch<SonarrSeries>(`/series/${id}`);
  }

  async addSeries(series: Record<string, unknown>): Promise<SonarrSeries> {
    return this.fetch<SonarrSeries>("/series", {
      method: "POST",
      body: JSON.stringify(series),
    });
  }

  async updateSeries(id: number, series: Record<string, unknown>): Promise<SonarrSeries> {
    return this.fetch<SonarrSeries>(`/series/${id}`, {
      method: "PUT",
      body: JSON.stringify(series),
    });
  }

  async deleteSeries(id: number, deleteFiles = false): Promise<void> {
    await this.fetch(`/series/${id}?deleteFiles=${deleteFiles}`, {
      method: "DELETE",
    });
  }

  async lookupSeries(term: string): Promise<SonarrLookupResult[]> {
    return this.fetch<SonarrLookupResult[]>(
      `/series/lookup?term=${encodeURIComponent(term)}`
    );
  }

  async getEpisodes(seriesId: number): Promise<SonarrEpisode[]> {
    return this.fetch<SonarrEpisode[]>(`/episode?seriesId=${seriesId}`);
  }

  async setEpisodeMonitored(episodeIds: number[], monitored: boolean): Promise<void> {
    await this.fetch("/episode/monitor", {
      method: "PUT",
      body: JSON.stringify({ episodeIds, monitored }),
    });
  }

  async getQueue(page = 1, pageSize = 20): Promise<{ page: number; pageSize: number; totalRecords: number; records: SonarrQueueItem[] }> {
    return this.fetch(`/queue?page=${page}&pageSize=${pageSize}&includeSeries=true&includeEpisode=true`);
  }

  async deleteQueueItem(id: number, removeFromClient = true, blocklist = false): Promise<void> {
    await this.fetch(
      `/queue/${id}?removeFromClient=${removeFromClient}&blocklist=${blocklist}`,
      { method: "DELETE" }
    );
  }

  async getCalendar(start: string, end: string): Promise<SonarrCalendarItem[]> {
    return this.fetch<SonarrCalendarItem[]>(
      `/calendar?start=${start}&end=${end}&includeSeries=true`
    );
  }

  async getHistory(page = 1, pageSize = 20): Promise<{ page: number; pageSize: number; totalRecords: number; records: SonarrHistoryRecord[] }> {
    return this.fetch(
      `/history?page=${page}&pageSize=${pageSize}&sortKey=date&sortDirection=descending&includeSeries=true&includeEpisode=true`
    );
  }

  async getQualityProfiles(): Promise<SonarrQualityProfile[]> {
    return this.fetch<SonarrQualityProfile[]>("/qualityprofile");
  }

  async getRootFolders(): Promise<SonarrRootFolder[]> {
    return this.fetch<SonarrRootFolder[]>("/rootfolder");
  }

  async getDiskSpace(): Promise<SonarrDiskSpace[]> {
    return this.fetch<SonarrDiskSpace[]>("/diskspace");
  }

  async command(name: string, seriesId?: number): Promise<unknown> {
    const body: Record<string, unknown> = { name };
    if (seriesId) body.seriesId = seriesId;
    return this.fetch("/command", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getReleases(seriesId: number, episodeId?: number): Promise<unknown[]> {
    let path = `/release?seriesId=${seriesId}`;
    if (episodeId) path += `&episodeId=${episodeId}`;
    return this.fetch<unknown[]>(path);
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

export const sonarrClient = new SonarrClient();
