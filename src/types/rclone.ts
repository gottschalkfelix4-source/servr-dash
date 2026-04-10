export type RcloneHealthStatus = "online" | "warning" | "offline" | "unknown";
export type RcloneTransferStatus = "running" | "success" | "error" | "stopped";
export type RcloneMountMode = "ro" | "rw" | "unknown";

export interface RcloneMountConfig {
  id: string;
  label: string;
  path: string;
  remoteName?: string;
  mode?: RcloneMountMode;
}

export interface RcloneProfileConfig {
  id: string;
  name: string;
  serverId: string;
  enabled: boolean;
  rcUrl?: string;
  rcPort?: number;
  username?: string;
  password?: string;
  label?: string;
  mounts: RcloneMountConfig[];
}

export interface RcloneConfig {
  profiles: RcloneProfileConfig[];
}

export interface RcloneTransferJob {
  id: string;
  profileId: string;
  name: string;
  status: RcloneTransferStatus;
  progress: number;
  speed: number;
  bytes: number;
  size: number;
  etaSeconds?: number | null;
  startedAt: number;
  finishedAt?: number;
  stoppable?: boolean;
  remote?: string;
  direction?: string;
  error?: string;
}

export interface RcloneStatsSnapshot {
  speed: number;
  transferringCount: number;
  totalTransfers: number;
  errors: number;
  bytes: number;
  checks: number;
}

export interface RcloneRcState {
  online: boolean;
  version?: string;
  error?: string;
  stats?: RcloneStatsSnapshot;
}

export interface RcloneMountStatus {
  profileId: string;
  mountId: string;
  label: string;
  path: string;
  remoteName?: string;
  mode?: RcloneMountMode;
  status: RcloneHealthStatus;
  isMounted: boolean;
  lastChecked: number;
  serverId?: string;
  serverName?: string;
  error?: string;
  probeLatencyMs?: number;
}

export interface RcloneProfileStatus {
  id: string;
  name: string;
  serverId: string;
  serverName: string;
  status: RcloneHealthStatus;
  enabled: boolean;
  checkedAt: number;
  rcOnline: boolean;
  mountsOnline: number;
  mountsDegraded: number;
  mountsTotal: number;
  activeTransfers: number;
  lastError: string | null;
  version?: string;
  stats: RcloneStatsSnapshot;
}

export interface RcloneHistoryPoint {
  timestamp: number;
  speed: number;
  activeTransfers: number;
  errors: number;
  mountsHealthy: number;
  mountsDegraded: number;
}

export interface RcloneOverview {
  profileCount: number;
  onlineProfiles: number;
  warningProfiles: number;
  offlineProfiles: number;
  unknownProfiles: number;
  activeTransfers: number;
  mountsHealthy: number;
  mountsDegraded: number;
  mountsTotal: number;
  totalSpeed: number;
  lastErrors: string[];
}
