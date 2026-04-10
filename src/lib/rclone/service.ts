import { fetchRcloneRcSnapshot, stopRcloneJob } from "@/lib/rclone/client";
import { checkRcloneMounts } from "@/lib/rclone/mounts";
import { summarizeRcloneProfile } from "@/lib/rclone/status";
import { getConfig } from "@/lib/config";
import type { ServerConfig } from "@/types/server";
import type {
  RcloneMountStatus,
  RcloneProfileConfig,
  RcloneProfileStatus,
  RcloneTransferJob,
} from "@/types/rclone";

export interface RcloneCollectedSnapshot {
  profile: RcloneProfileStatus;
  mounts: RcloneMountStatus[];
  activeTransfers: RcloneTransferJob[];
  recentTransfers: RcloneTransferJob[];
}

export function getRcloneProfiles() {
  return getConfig().rclone?.profiles ?? [];
}

function getServers() {
  return getConfig().servers;
}

function findServer(serverId: string) {
  return getServers().find((server) => server.id === serverId);
}

function createServerMissingSnapshot(profile: RcloneProfileConfig): RcloneCollectedSnapshot {
  const checkedAt = Date.now();
  const mounts = profile.mounts.map((mount) => ({
    profileId: profile.id,
    mountId: mount.id,
    label: mount.label,
    path: mount.path,
    remoteName: mount.remoteName,
    mode: mount.mode,
    status: "offline" as const,
    isMounted: false,
    lastChecked: checkedAt,
    serverId: profile.serverId,
    serverName: "Unbekannter Server",
    error: "Server not found in config",
  }));

  return {
    profile: summarizeRcloneProfile({
      profile,
      serverName: "Unbekannter Server",
      serverConnected: false,
      rc: { online: false, error: "Server not found in config" },
      mounts,
      checkedAt,
      activeTransfers: [],
    }),
    mounts,
    activeTransfers: [],
    recentTransfers: [],
  };
}

export async function collectRcloneProfileSnapshot(
  profile: RcloneProfileConfig,
  serverOverride?: ServerConfig
): Promise<RcloneCollectedSnapshot> {
  const server = serverOverride ?? findServer(profile.serverId);
  if (!server) {
    return createServerMissingSnapshot(profile);
  }

  const checkedAt = Date.now();
  const rcSnapshot = await fetchRcloneRcSnapshot(profile, server);
  const mountResult = await checkRcloneMounts(
    profile,
    server,
    rcSnapshot.mountPoints
  );

  const profileStatus = summarizeRcloneProfile({
    profile,
    serverName: server.name,
    serverConnected: mountResult.serverConnected,
    rc: rcSnapshot.state,
    mounts: mountResult.mounts,
    checkedAt,
    activeTransfers: rcSnapshot.activeTransfers,
  });

  return {
    profile: profileStatus,
    mounts: mountResult.mounts,
    activeTransfers: rcSnapshot.activeTransfers,
    recentTransfers: rcSnapshot.recentTransfers,
  };
}

export async function stopRcloneProfileJob(profileId: string, jobId: string) {
  const profile = getRcloneProfiles().find((item) => item.id === profileId);
  if (!profile) {
    throw new Error("Rclone profile not found");
  }

  const server = findServer(profile.serverId);
  if (!server) {
    throw new Error("Server not found");
  }

  await stopRcloneJob(profile, server, jobId);
}
