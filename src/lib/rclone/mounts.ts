import { sshPool } from "@/lib/ssh/connection-pool";
import type { ServerConfig } from "@/types/server";
import type {
  RcloneMountConfig,
  RcloneMountStatus,
  RcloneProfileConfig,
} from "@/types/rclone";

function quoteShell(value: string) {
  return value.replace(/'/g, `'\\''`);
}

function buildMountCheckCommand(path: string) {
  const quotedPath = quoteShell(path);
  return [
    `MOUNT_PATH='${quotedPath}'`,
    "STATE='missing'",
    "PROBE='skip'",
    "if [ -e \"$MOUNT_PATH\" ]; then",
    "  if (command -v mountpoint >/dev/null 2>&1 && mountpoint -q \"$MOUNT_PATH\") || (command -v findmnt >/dev/null 2>&1 && findmnt -T \"$MOUNT_PATH\" >/dev/null 2>&1); then",
    "    STATE='mounted'",
    "  else",
    "    STATE='present'",
    "  fi",
    "  if [ \"$STATE\" = 'mounted' ]; then",
    "    if command -v timeout >/dev/null 2>&1; then",
    "      timeout 3 sh -c 'ls -1 \"$1\" >/dev/null 2>&1' _ \"$MOUNT_PATH\"",
    "    else",
    "      ls -1 \"$MOUNT_PATH\" >/dev/null 2>&1",
    "    fi",
    "    if [ $? -eq 0 ]; then PROBE='ok'; else PROBE='fail'; fi",
    "  fi",
    "fi",
    "printf '%s|%s' \"$STATE\" \"$PROBE\"",
  ].join("; ");
}

function toOfflineMounts(
  profile: RcloneProfileConfig,
  server: ServerConfig,
  mounts: RcloneMountConfig[],
  error: string
): RcloneMountStatus[] {
  const now = Date.now();
  return mounts.map((mount) => ({
    profileId: profile.id,
    mountId: mount.id,
    label: mount.label,
    path: mount.path,
    remoteName: mount.remoteName,
    mode: mount.mode,
    status: "offline",
    isMounted: false,
    lastChecked: now,
    serverId: server.id,
    serverName: server.name,
    error,
  }));
}

export async function checkRcloneMounts(
  profile: RcloneProfileConfig,
  server: ServerConfig,
  rcMountPoints: string[]
) {
  if (profile.mounts.length === 0) {
    try {
      await sshPool.exec(server, "printf ready");
      return { serverConnected: true, mounts: [] as RcloneMountStatus[] };
    } catch (error) {
      return {
        serverConnected: false,
        mounts: [] as RcloneMountStatus[],
        error: error instanceof Error ? error.message : "SSH not reachable",
      };
    }
  }

  try {
    const mounts = await Promise.all(
      profile.mounts.map(async (mount) => {
        const started = Date.now();
        const output = await sshPool.exec(server, buildMountCheckCommand(mount.path));
        const [state, probe] = output.trim().split("|");
        const listedByRc = rcMountPoints.includes(mount.path);
        const isMounted = state === "mounted" || listedByRc;
        const status =
          isMounted && probe !== "fail"
            ? "online"
            : state === "missing"
            ? "warning"
            : "warning";

        return {
          profileId: profile.id,
          mountId: mount.id,
          label: mount.label,
          path: mount.path,
          remoteName: mount.remoteName,
          mode: mount.mode,
          status,
          isMounted,
          lastChecked: Date.now(),
          serverId: server.id,
          serverName: server.name,
          error:
            status === "online"
              ? undefined
              : state === "missing"
              ? "Mount path does not exist"
              : probe === "fail"
              ? "Mount is present but probe failed"
              : "Mount path is not mounted",
          probeLatencyMs: Date.now() - started,
        } satisfies RcloneMountStatus;
      })
    );

    return { serverConnected: true, mounts };
  } catch (error) {
    return {
      serverConnected: false,
      mounts: toOfflineMounts(
        profile,
        server,
        profile.mounts,
        error instanceof Error ? error.message : "SSH not reachable"
      ),
      error: error instanceof Error ? error.message : "SSH not reachable",
    };
  }
}
