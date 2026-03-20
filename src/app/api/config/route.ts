import { NextResponse } from "next/server";
import { getConfig, saveConfig } from "@/lib/config";
import type { AppConfig } from "@/types/server";

// Mask sensitive fields before sending to frontend
function sanitizeConfig(config: AppConfig): Record<string, unknown> {
  return {
    servers: config.servers.map((s) => ({
      ...s,
      password: s.password ? "••••••••" : undefined,
      privateKeyPath: s.privateKeyPath || undefined,
    })),
    plex: {
      url: config.plex.url,
      token: config.plex.token ? "••••••••" : undefined,
      clientId: config.plex.clientId,
    },
    radarr: config.radarr
      ? { url: config.radarr.url, apiKey: config.radarr.apiKey ? "••••••••" : undefined }
      : undefined,
    sonarr: config.sonarr
      ? { url: config.sonarr.url, apiKey: config.sonarr.apiKey ? "••••••••" : undefined }
      : undefined,
    cloudflare: config.cloudflare
      ? { apiToken: config.cloudflare.apiToken ? "••••••••" : undefined }
      : undefined,
    synology: config.synology
      ? { url: config.synology.url, username: config.synology.username, password: "••••••••" }
      : undefined,
    indexers: (config.indexers || []).map((i) => ({
      name: i.name,
      url: i.url,
      apiKey: i.apiKey ? "••••••••" : undefined,
    })),
    tmdbApiKey: config.tmdbApiKey ? "••••••••" : undefined,
    openclaw: config.openclaw
      ? {
          url: config.openclaw.url,
          authMethod: config.openclaw.authMethod || "none",
          token: config.openclaw.token ? "••••••••" : undefined,
          password: config.openclaw.password ? "••••••••" : undefined,
          model: config.openclaw.model,
        }
      : undefined,
  };
}

export async function GET() {
  const config = getConfig();
  return NextResponse.json(sanitizeConfig(config));
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const existing = getConfig();

    // Merge: only update fields that are not masked placeholders
    const merged: AppConfig = {
      ...existing,
      servers: body.servers
        ? body.servers.map((s: Record<string, unknown>) => {
            const existingServer = existing.servers.find((es) => es.id === s.id);
            return {
              ...s,
              // Keep existing password/key if masked value was sent back
              password:
                s.password === "••••••••" ? existingServer?.password : s.password,
              privateKeyPath:
                s.privateKeyPath === undefined
                  ? existingServer?.privateKeyPath
                  : s.privateKeyPath,
            };
          })
        : existing.servers,
      plex: {
        url: body.plex?.url || existing.plex.url,
        token:
          body.plex?.token === "••••••••"
            ? existing.plex.token
            : body.plex?.token ?? existing.plex.token,
        clientId: existing.plex.clientId,
      },
    };

    // Radarr
    if (body.radarr) {
      merged.radarr = {
        url: body.radarr.url,
        apiKey:
          body.radarr.apiKey === "••••••••"
            ? existing.radarr?.apiKey || ""
            : body.radarr.apiKey,
      };
    } else if (body.radarr === undefined && existing.radarr) {
      merged.radarr = existing.radarr;
    }

    // Sonarr
    if (body.sonarr) {
      merged.sonarr = {
        url: body.sonarr.url,
        apiKey:
          body.sonarr.apiKey === "••••••••"
            ? existing.sonarr?.apiKey || ""
            : body.sonarr.apiKey,
      };
    } else if (body.sonarr === undefined && existing.sonarr) {
      merged.sonarr = existing.sonarr;
    }

    // Cloudflare
    if (body.cloudflare) {
      merged.cloudflare = {
        apiToken:
          body.cloudflare.apiToken === "••••••••"
            ? existing.cloudflare?.apiToken || ""
            : body.cloudflare.apiToken,
      };
    } else if (body.cloudflare === undefined && existing.cloudflare) {
      merged.cloudflare = existing.cloudflare;
    }

    // Synology
    if (body.synology) {
      merged.synology = {
        url: body.synology.url,
        username: body.synology.username,
        password:
          body.synology.password === "••••••••"
            ? existing.synology?.password || ""
            : body.synology.password,
      };
    } else if (body.synology === undefined && existing.synology) {
      merged.synology = existing.synology;
    }

    // Indexers
    if (body.indexers) {
      merged.indexers = body.indexers.map(
        (i: { name: string; url: string; apiKey: string }, idx: number) => ({
          name: i.name,
          url: i.url,
          apiKey:
            i.apiKey === "••••••••"
              ? existing.indexers?.[idx]?.apiKey || ""
              : i.apiKey,
        })
      );
    } else if (body.indexers === undefined && existing.indexers) {
      merged.indexers = existing.indexers;
    }

    // OpenClaw
    if (body.openclaw) {
      merged.openclaw = {
        url: body.openclaw.url,
        authMethod: body.openclaw.authMethod || "none",
        token:
          body.openclaw.token === "••••••••"
            ? existing.openclaw?.token
            : body.openclaw.token,
        password:
          body.openclaw.password === "••••••••"
            ? existing.openclaw?.password
            : body.openclaw.password,
        model: body.openclaw.model,
      };
    } else if (body.openclaw === undefined && existing.openclaw) {
      merged.openclaw = existing.openclaw;
    }

    // TMDB
    if (body.tmdbApiKey !== undefined) {
      merged.tmdbApiKey =
        body.tmdbApiKey === "••••••••"
          ? existing.tmdbApiKey
          : body.tmdbApiKey;
    }

    saveConfig(merged);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to save config" },
      { status: 400 }
    );
  }
}
