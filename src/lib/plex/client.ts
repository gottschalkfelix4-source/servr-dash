import { getPlexUrl, getPlexToken } from "@/lib/config";
import type {
  PlexServerStatus,
  PlexLibrary,
  PlexSession,
  PlexUser,
} from "@/types/plex";

class PlexClient {
  private get baseUrl() {
    return getPlexUrl();
  }

  private get token() {
    return getPlexToken();
  }

  private async fetch<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const separator = path.includes("?") ? "&" : "?";
    const fullUrl = `${url}${separator}X-Plex-Token=${this.token}`;

    const res = await fetch(fullUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Plex API error: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  async getStatus(): Promise<PlexServerStatus> {
    try {
      const data = await this.fetch<{
        MediaContainer: {
          friendlyName?: string;
          version?: string;
          platform?: string;
        };
      }>("/");

      return {
        name: data.MediaContainer.friendlyName || "Plex Server",
        version: data.MediaContainer.version || "",
        platform: data.MediaContainer.platform || "",
        online: true,
      };
    } catch {
      return {
        name: "Plex Server",
        version: "",
        platform: "",
        online: false,
      };
    }
  }

  async getLibraries(): Promise<PlexLibrary[]> {
    const data = await this.fetch<{
      MediaContainer: {
        Directory?: Array<{
          key: string;
          title: string;
          type: string;
          art?: string;
          thumb?: string;
        }>;
      };
    }>("/library/sections");

    const directories = data.MediaContainer.Directory || [];

    // Fetch all library counts in parallel (instead of sequential N+1)
    const libraries = await Promise.all(
      directories.map(async (dir) => {
        let count = 0;
        try {
          const countData = await this.fetch<{
            MediaContainer: { totalSize?: number; size?: number };
          }>(
            `/library/sections/${dir.key}/all?X-Plex-Container-Start=0&X-Plex-Container-Size=0`
          );
          count =
            countData.MediaContainer.totalSize ||
            countData.MediaContainer.size ||
            0;
        } catch {
          // ignore count errors
        }

        return {
          key: dir.key,
          title: dir.title,
          type: dir.type as PlexLibrary["type"],
          count,
          icon: dir.thumb || "",
        };
      })
    );

    return libraries;
  }

  async getSessions(): Promise<PlexSession[]> {
    try {
      const data = await this.fetch<{
        MediaContainer: {
          Metadata?: Array<Record<string, unknown>>;
        };
      }>("/status/sessions");

      const metadata = data.MediaContainer.Metadata || [];

      return metadata.map((m) => {
        const media = (m.Media as Array<Record<string, unknown>>)?.[0] || {};
        const part = (media.Part as Array<Record<string, unknown>>)?.[0] || {};
        const user = (m.User as Record<string, unknown>) || {};
        const player = (m.Player as Record<string, unknown>) || {};
        const session = (m.Session as Record<string, unknown>) || {};
        const transcodeSession =
          (m.TranscodeSession as Record<string, unknown>) || {};

        const duration = (m.duration as number) || 0;
        const viewOffset = (m.viewOffset as number) || 0;

        return {
          sessionKey: (m.sessionKey as string) || String(m.ratingKey || ""),
          title: (m.title as string) || "",
          grandparentTitle: m.grandparentTitle as string | undefined,
          type: (m.type as PlexSession["type"]) || "movie",
          year: m.year as number | undefined,
          thumb: m.thumb as string | undefined,
          user: (user.title as string) || "Unknown",
          player: (player.title as string) || "",
          playerPlatform: (player.platform as string) || "",
          videoResolution: (media.videoResolution as string) || "",
          videoDecision:
            ((part.decision as string) as PlexSession["videoDecision"]) ||
            "directplay",
          audioDecision:
            ((part.decision as string) as PlexSession["audioDecision"]) ||
            "directplay",
          progress: duration > 0 ? (viewOffset / duration) * 100 : 0,
          duration,
          viewOffset,
          bandwidth: (session.bandwidth as number) || 0,
          transcodeProgress: transcodeSession.progress as number | undefined,
        };
      });
    } catch {
      return [];
    }
  }

  async getUsers(): Promise<PlexUser[]> {
    try {
      const data = await this.fetch<{
        MediaContainer: {
          User?: Array<{ id: string; title: string; thumb?: string }>;
        };
      }>("/accounts");

      return (data.MediaContainer.User || []).map((u) => ({
        id: String(u.id),
        title: u.title,
        thumb: u.thumb,
      }));
    } catch {
      return [];
    }
  }
}

export const plexClient = new PlexClient();
