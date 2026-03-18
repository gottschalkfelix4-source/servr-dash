import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "fs";
import { join, dirname } from "path";
import type { AppConfig } from "@/types/server";

const CONFIG_PATH = join(process.cwd(), "config", "servers.json");

const DEFAULT_CONFIG: AppConfig = {
  servers: [],
  plex: {
    url: process.env.PLEX_URL || "http://localhost:32400",
    token: process.env.PLEX_TOKEN || "",
  },
};

// In-memory cache with mtime-based invalidation
let cachedConfig: AppConfig | null = null;
let cachedMtime = 0;

export function getConfig(): AppConfig {
  if (!existsSync(CONFIG_PATH)) {
    return DEFAULT_CONFIG;
  }
  try {
    const mtime = statSync(CONFIG_PATH).mtimeMs;
    if (cachedConfig && mtime === cachedMtime) {
      return cachedConfig;
    }
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    cachedConfig = JSON.parse(raw) as AppConfig;
    cachedMtime = mtime;
    return cachedConfig;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function invalidateCache() {
  cachedConfig = null;
  cachedMtime = 0;
}

export function saveConfig(config: AppConfig): void {
  const dir = dirname(CONFIG_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
  // Update cache immediately instead of waiting for next read
  cachedConfig = config;
  cachedMtime = existsSync(CONFIG_PATH) ? statSync(CONFIG_PATH).mtimeMs : 0;
}

export function getPlexUrl(): string {
  const config = getConfig();
  return config.plex.url || process.env.PLEX_URL || "http://localhost:32400";
}

export function getPlexToken(): string {
  const config = getConfig();
  return config.plex.token || process.env.PLEX_TOKEN || "";
}

export function savePlexToken(token: string, url?: string): void {
  const config = getConfig();
  config.plex.token = token;
  if (url) config.plex.url = url;
  saveConfig(config);
}

export function getRadarrConfig() {
  const config = getConfig();
  return config.radarr || null;
}

export function getSonarrConfig() {
  const config = getConfig();
  return config.sonarr || null;
}

export function getPlexClientId(): string {
  const config = getConfig();
  if (config.plex.clientId) return config.plex.clientId;
  const clientId = crypto.randomUUID();
  config.plex.clientId = clientId;
  saveConfig(config);
  return clientId;
}
