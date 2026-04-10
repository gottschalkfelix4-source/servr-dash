import path from "node:path";
import { sshPool } from "@/lib/ssh/connection-pool";
import type { ServerConfig } from "@/types/server";
import type {
  RcloneDiscoveredMount,
  RcloneMountConfig,
  RcloneMountStatus,
  RcloneProfileConfig,
  RcloneResolvedMount,
} from "@/types/rclone";

function quoteShell(value: string) {
  return value.replace(/'/g, `'\\''`);
}

function normalizeMountPath(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return trimmed || "/";
  }

  return trimmed.replace(/\/+$/, "");
}

function createDiscoveredMountId(mountPath: string) {
  const normalized = normalizeMountPath(mountPath)
    .replace(/^\/+/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `discovered-${normalized || "mount"}`;
}

function createMountLabel(mountPath: string) {
  const normalized = normalizeMountPath(mountPath);
  return path.posix.basename(normalized) || normalized || "mount";
}

function isRcloneLikeMount(fstype: string, source: string) {
  const normalizedFsType = fstype.trim().toLowerCase();
  const normalizedSource = source.trim().toLowerCase();

  return (
    normalizedFsType.includes("fuse") &&
    (normalizedFsType.includes("rclone") ||
      normalizedSource.includes("rclone") ||
      normalizedSource.includes(":"))
  );
}

function buildMountDiscoveryCommand() {
  return [
    "if command -v findmnt >/dev/null 2>&1; then",
    "  findmnt -rn -o TARGET,FSTYPE,SOURCE | awk '{print $1 \"|\" $2 \"|\" $3}'",
    "elif [ -r /proc/mounts ]; then",
    "  awk '{print $2 \"|\" $3 \"|\" $1}' /proc/mounts",
    "else",
    "  printf ''",
    "fi",
  ].join("; ");
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

export function normalizeDiscoveredSshMounts(
  output: string
): RcloneDiscoveredMount[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [mountPath = "", fsType = "", source = ""] = line.split("|");
      return {
        mountPath: normalizeMountPath(mountPath),
        fsType,
        source,
      };
    })
    .filter(
      (mount): mount is { mountPath: string; fsType: string; source: string } =>
        Boolean(mount.mountPath) && isRcloneLikeMount(mount.fsType, mount.source)
    )
    .map((mount) => ({
      path: mount.mountPath,
      label: createMountLabel(mount.mountPath),
      remoteName: mount.source.trim() || undefined,
      mode: "unknown" as const,
      discoveredBy: "ssh" as const,
    }));
}

function normalizeDiscoveredRcMounts(
  mountPoints: string[]
): RcloneDiscoveredMount[] {
  return mountPoints
    .map((mountPoint) => normalizeMountPath(mountPoint))
    .filter(Boolean)
    .map((mountPoint) => ({
      path: mountPoint,
      label: createMountLabel(mountPoint),
      mode: "unknown" as const,
      discoveredBy: "rc" as const,
    }));
}

function dedupeDiscoveredMounts(
  mounts: RcloneDiscoveredMount[]
): RcloneDiscoveredMount[] {
  const byPath = new Map<string, RcloneDiscoveredMount>();

  for (const mount of mounts) {
    const key = normalizeMountPath(mount.path);
    const existing = byPath.get(key);
    if (!existing) {
      byPath.set(key, { ...mount, path: key });
      continue;
    }

    byPath.set(key, {
      ...existing,
      ...mount,
      path: key,
      label: existing.label || mount.label,
      remoteName: existing.remoteName || mount.remoteName,
      discoveredBy:
        existing.discoveredBy === "ssh" || mount.discoveredBy === "ssh"
          ? "ssh"
          : "rc",
    });
  }

  return [...byPath.values()];
}

export function mergeDiscoveredMounts(
  configuredMounts: RcloneMountConfig[],
  discoveredMounts: RcloneDiscoveredMount[]
): RcloneResolvedMount[] {
  const manualMounts: RcloneResolvedMount[] = configuredMounts.map((mount) => ({
    ...mount,
    path: normalizeMountPath(mount.path),
    source: "manual" as const,
  }));

  const seenPaths = new Set(manualMounts.map((mount) => normalizeMountPath(mount.path)));
  const merged: RcloneResolvedMount[] = [...manualMounts];

  for (const mount of dedupeDiscoveredMounts(discoveredMounts)) {
    const normalizedPath = normalizeMountPath(mount.path);
    if (seenPaths.has(normalizedPath)) {
      continue;
    }

    seenPaths.add(normalizedPath);
    merged.push({
      id: createDiscoveredMountId(normalizedPath),
      label: mount.label || createMountLabel(normalizedPath),
      path: normalizedPath,
      remoteName: mount.remoteName,
      mode: mount.mode || "unknown",
      source: "discovered",
      discoveredBy: mount.discoveredBy,
    });
  }

  return merged;
}

async function discoverMountsViaSsh(server: ServerConfig) {
  const output = await sshPool.exec(server, buildMountDiscoveryCommand());
  return normalizeDiscoveredSshMounts(output);
}

function toOfflineMounts(
  profile: RcloneProfileConfig,
  server: ServerConfig,
  mounts: RcloneResolvedMount[],
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
    source: mount.source,
    discoveredBy: mount.discoveredBy,
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
  try {
    const sshDiscoveredMounts = await discoverMountsViaSsh(server);
    const mountsToCheck = mergeDiscoveredMounts(profile.mounts, [
      ...sshDiscoveredMounts,
      ...normalizeDiscoveredRcMounts(rcMountPoints),
    ]);

    if (mountsToCheck.length === 0) {
      return { serverConnected: true, mounts: [] as RcloneMountStatus[] };
    }

    const mounts = await Promise.all(
      mountsToCheck.map(async (mount) => {
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
          source: mount.source,
          discoveredBy: mount.discoveredBy,
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
        mergeDiscoveredMounts(profile.mounts, normalizeDiscoveredRcMounts(rcMountPoints)),
        error instanceof Error ? error.message : "SSH not reachable"
      ),
      error: error instanceof Error ? error.message : "SSH not reachable",
    };
  }
}
