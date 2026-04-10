import { NextResponse } from "next/server";
import { getConfig, saveConfig } from "@/lib/config";
import type { AppConfig } from "@/types/server";

const MASKED_SECRET = "••••••••";

function sanitizeConfig(config: AppConfig): Record<string, unknown> {
  return {
    servers: config.servers.map((server) => ({
      ...server,
      password: server.password ? MASKED_SECRET : undefined,
      privateKeyPath: server.privateKeyPath || undefined,
    })),
    plex: {
      url: config.plex.url,
      token: config.plex.token ? MASKED_SECRET : undefined,
      clientId: config.plex.clientId,
    },
    radarr: config.radarr
      ? {
          url: config.radarr.url,
          apiKey: config.radarr.apiKey ? MASKED_SECRET : undefined,
        }
      : undefined,
    sonarr: config.sonarr
      ? {
          url: config.sonarr.url,
          apiKey: config.sonarr.apiKey ? MASKED_SECRET : undefined,
        }
      : undefined,
    cloudflare: config.cloudflare
      ? {
          apiToken: config.cloudflare.apiToken ? MASKED_SECRET : undefined,
        }
      : undefined,
    synology: config.synology
      ? {
          url: config.synology.url,
          username: config.synology.username,
          password: MASKED_SECRET,
        }
      : undefined,
    indexers: (config.indexers || []).map((indexer) => ({
      name: indexer.name,
      url: indexer.url,
      apiKey: indexer.apiKey ? MASKED_SECRET : undefined,
    })),
    rclone: config.rclone
      ? {
          profiles: config.rclone.profiles.map((profile) => ({
            ...profile,
            password: profile.password ? MASKED_SECRET : undefined,
            mounts: profile.mounts || [],
          })),
        }
      : undefined,
    tmdbApiKey: config.tmdbApiKey ? MASKED_SECRET : undefined,
    openclaw: config.openclaw
      ? {
          url: config.openclaw.url,
          authMethod: config.openclaw.authMethod || "none",
          token: config.openclaw.token ? MASKED_SECRET : undefined,
          password: config.openclaw.password ? MASKED_SECRET : undefined,
          model: config.openclaw.model,
        }
      : undefined,
  };
}

export async function GET() {
  return NextResponse.json(sanitizeConfig(getConfig()));
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const existing = getConfig();

    const merged: AppConfig = {
      ...existing,
      servers: body.servers
        ? body.servers.map((server: Record<string, unknown>) => {
            const existingServer = existing.servers.find(
              (item) => item.id === server.id
            );

            return {
              ...server,
              password:
                server.password === MASKED_SECRET
                  ? existingServer?.password
                  : server.password,
              privateKeyPath:
                server.privateKeyPath === undefined
                  ? existingServer?.privateKeyPath
                  : server.privateKeyPath,
            };
          })
        : existing.servers,
      plex: {
        url: body.plex?.url || existing.plex.url,
        token:
          body.plex?.token === MASKED_SECRET
            ? existing.plex.token
            : body.plex?.token ?? existing.plex.token,
        clientId: existing.plex.clientId,
      },
    };

    if (body.radarr) {
      merged.radarr = {
        url: body.radarr.url,
        apiKey:
          body.radarr.apiKey === MASKED_SECRET
            ? existing.radarr?.apiKey || ""
            : body.radarr.apiKey,
      };
    } else if (body.radarr === undefined && existing.radarr) {
      merged.radarr = existing.radarr;
    }

    if (body.sonarr) {
      merged.sonarr = {
        url: body.sonarr.url,
        apiKey:
          body.sonarr.apiKey === MASKED_SECRET
            ? existing.sonarr?.apiKey || ""
            : body.sonarr.apiKey,
      };
    } else if (body.sonarr === undefined && existing.sonarr) {
      merged.sonarr = existing.sonarr;
    }

    if (body.cloudflare) {
      merged.cloudflare = {
        apiToken:
          body.cloudflare.apiToken === MASKED_SECRET
            ? existing.cloudflare?.apiToken || ""
            : body.cloudflare.apiToken,
      };
    } else if (body.cloudflare === undefined && existing.cloudflare) {
      merged.cloudflare = existing.cloudflare;
    }

    if (body.synology) {
      merged.synology = {
        url: body.synology.url,
        username: body.synology.username,
        password:
          body.synology.password === MASKED_SECRET
            ? existing.synology?.password || ""
            : body.synology.password,
      };
    } else if (body.synology === undefined && existing.synology) {
      merged.synology = existing.synology;
    }

    if (body.indexers) {
      merged.indexers = body.indexers.map(
        (indexer: { name: string; url: string; apiKey: string }, idx: number) => ({
          name: indexer.name,
          url: indexer.url,
          apiKey:
            indexer.apiKey === MASKED_SECRET
              ? existing.indexers?.[idx]?.apiKey || ""
              : indexer.apiKey,
        })
      );
    } else if (body.indexers === undefined && existing.indexers) {
      merged.indexers = existing.indexers;
    }

    if (body.rclone) {
      merged.rclone = {
        profiles: (body.rclone.profiles || []).map(
          (profile: Record<string, unknown>) => {
            const existingProfile = existing.rclone?.profiles.find(
              (item) => item.id === profile.id
            );

            return {
              id: String(profile.id || ""),
              name: String(profile.name || ""),
              serverId: String(profile.serverId || ""),
              enabled: Boolean(profile.enabled),
              rcUrl:
                typeof profile.rcUrl === "string" && profile.rcUrl
                  ? profile.rcUrl
                  : undefined,
              rcPort:
                typeof profile.rcPort === "number"
                  ? profile.rcPort
                  : typeof profile.rcPort === "string" && profile.rcPort
                  ? Number(profile.rcPort)
                  : undefined,
              username:
                typeof profile.username === "string" && profile.username
                  ? profile.username
                  : undefined,
              password:
                profile.password === MASKED_SECRET
                  ? existingProfile?.password
                  : typeof profile.password === "string" && profile.password
                  ? profile.password
                  : undefined,
              label:
                typeof profile.label === "string" && profile.label
                  ? profile.label
                  : undefined,
              mounts: Array.isArray(profile.mounts)
                ? profile.mounts.map((mount: Record<string, unknown>) => ({
                    id: String(mount.id || ""),
                    label: String(mount.label || ""),
                    path: String(mount.path || ""),
                    remoteName:
                      typeof mount.remoteName === "string" && mount.remoteName
                        ? mount.remoteName
                        : undefined,
                    mode:
                      mount.mode === "ro" || mount.mode === "rw"
                        ? mount.mode
                        : "unknown",
                  }))
                : [],
            };
          }
        ),
      };
    } else if (body.rclone === undefined && existing.rclone) {
      merged.rclone = existing.rclone;
    }

    if (body.openclaw) {
      merged.openclaw = {
        url: body.openclaw.url,
        authMethod: body.openclaw.authMethod || "none",
        token:
          body.openclaw.token === MASKED_SECRET
            ? existing.openclaw?.token
            : body.openclaw.token,
        password:
          body.openclaw.password === MASKED_SECRET
            ? existing.openclaw?.password
            : body.openclaw.password,
        model: body.openclaw.model,
      };
    } else if (body.openclaw === undefined && existing.openclaw) {
      merged.openclaw = existing.openclaw;
    }

    if (body.tmdbApiKey !== undefined) {
      merged.tmdbApiKey =
        body.tmdbApiKey === MASKED_SECRET
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
