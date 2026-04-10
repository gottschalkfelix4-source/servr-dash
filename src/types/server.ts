import type { RcloneConfig } from "@/types/rclone";

export interface ServerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: "key" | "password";
  privateKeyPath?: string;
  password?: string;
  dockerEnabled?: boolean;
}

export interface CpuMetrics {
  usage: number; // 0-100
}

export interface RamMetrics {
  total: number; // bytes
  used: number;
  available: number;
  percent: number; // 0-100
}

export interface DiskMetrics {
  mount: string;
  filesystem: string;
  total: number; // bytes
  used: number;
  available: number;
  percent: number;
}

export interface NetworkMetrics {
  interface: string;
  rxBytesPerSec: number;
  txBytesPerSec: number;
}

export interface OsInfo {
  name: string;
  kernel: string;
  arch: string;
  hostname: string;
}

export interface ProcessInfo {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  command: string;
}

export interface ServerMetrics {
  cpu: number; // usage percent
  ram: RamMetrics;
  disk: DiskMetrics[];
  network: NetworkMetrics[];
  uptime: number; // seconds
  os: OsInfo;
  timestamp: number;
}

export interface TimestampedMetrics {
  cpu: number;
  ramPercent: number;
  rxBytesPerSec: number;
  txBytesPerSec: number;
  timestamp: number;
}

export interface ArrConfig {
  url: string;
  apiKey: string;
}

export interface AppConfig {
  servers: ServerConfig[];
  plex: {
    url: string;
    token?: string;
    clientId?: string;
  };
  radarr?: ArrConfig;
  sonarr?: ArrConfig;
  cloudflare?: {
    apiToken: string;
  };
  synology?: {
    url: string;
    username: string;
    password: string;
  };
  tmdbApiKey?: string;
  indexers?: { name: string; url: string; apiKey: string }[];
  rclone?: RcloneConfig;
  openclaw?: {
    url: string;
    authMethod?: "none" | "token" | "password";
    token?: string;
    password?: string;
    model?: string;
  };
  [key: string]: unknown;
}
