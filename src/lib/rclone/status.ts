import type {
  RcloneMountStatus,
  RcloneOverview,
  RcloneProfileConfig,
  RcloneProfileStatus,
  RcloneRcState,
  RcloneStatsSnapshot,
  RcloneTransferJob,
} from "@/types/rclone";

interface SummarizeProfileInput {
  profile: RcloneProfileConfig;
  serverName: string;
  serverConnected: boolean;
  rc: RcloneRcState;
  mounts: RcloneMountStatus[];
  checkedAt: number;
  activeTransfers: RcloneTransferJob[];
}

const EMPTY_STATS: RcloneStatsSnapshot = {
  speed: 0,
  transferringCount: 0,
  totalTransfers: 0,
  errors: 0,
  bytes: 0,
  checks: 0,
};

export function summarizeRcloneProfile({
  profile,
  serverName,
  serverConnected,
  rc,
  mounts,
  checkedAt,
  activeTransfers,
}: SummarizeProfileInput): RcloneProfileStatus {
  const mountsOnline = mounts.filter((mount) => mount.status === "online").length;
  const mountsDegraded = mounts.filter((mount) => mount.status !== "online").length;
  const stats = rc.stats ?? EMPTY_STATS;

  let status: RcloneProfileStatus["status"] = "unknown";
  if (!profile.enabled) {
    status = "unknown";
  } else if (rc.online && mountsDegraded === 0) {
    status = "online";
  } else if (!rc.online && !serverConnected) {
    status = "offline";
  } else if (rc.online || serverConnected || mountsDegraded > 0) {
    status = "warning";
  }

  const lastError =
    mounts.find((mount) => mount.error)?.error ??
    rc.error ??
    null;

  return {
    id: profile.id,
    name: profile.name,
    serverId: profile.serverId,
    serverName,
    status,
    enabled: profile.enabled,
    checkedAt,
    rcOnline: rc.online,
    mountsOnline,
    mountsDegraded,
    mountsTotal: mounts.length,
    activeTransfers: activeTransfers.length,
    lastError,
    version: rc.version,
    stats: {
      ...EMPTY_STATS,
      ...stats,
      transferringCount: activeTransfers.length || stats.transferringCount,
    },
  };
}

export function buildRcloneOverview(
  profiles: RcloneProfileStatus[]
): RcloneOverview {
  const overview: RcloneOverview = {
    profileCount: profiles.length,
    onlineProfiles: 0,
    warningProfiles: 0,
    offlineProfiles: 0,
    unknownProfiles: 0,
    activeTransfers: 0,
    mountsHealthy: 0,
    mountsDegraded: 0,
    mountsTotal: 0,
    totalSpeed: 0,
    lastErrors: [],
  };

  const errors = new Set<string>();

  for (const profile of profiles) {
    if (profile.status === "online") overview.onlineProfiles += 1;
    if (profile.status === "warning") overview.warningProfiles += 1;
    if (profile.status === "offline") overview.offlineProfiles += 1;
    if (profile.status === "unknown") overview.unknownProfiles += 1;

    overview.activeTransfers += profile.activeTransfers;
    overview.mountsHealthy += profile.mountsOnline;
    overview.mountsDegraded += profile.mountsDegraded;
    overview.mountsTotal += profile.mountsTotal;
    overview.totalSpeed += profile.stats.speed;

    if (profile.lastError) {
      errors.add(profile.lastError);
    }
  }

  overview.lastErrors = [...errors].slice(0, 5);
  return overview;
}
