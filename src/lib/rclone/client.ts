import type { ServerConfig } from "@/types/server";
import type {
  RcloneProfileConfig,
  RcloneRcState,
  RcloneStatsSnapshot,
  RcloneTransferJob,
} from "@/types/rclone";

interface RawVersionResponse {
  version?: string;
  decomposed?: { version?: string };
}

interface RawStatsResponse {
  speed?: number;
  bytes?: number;
  errors?: number;
  checks?: number;
  totalChecks?: number;
  totalTransfers?: number;
  transferring?: Array<Record<string, unknown>>;
}

interface RawTransferredResponse {
  transferred?: Array<Record<string, unknown>>;
}

interface RawJobListResponse {
  runningIds?: number[];
  finishedIds?: number[];
  jobids?: number[];
}

interface RawJobStatusResponse {
  id?: number;
  error?: string;
  finished?: boolean;
  success?: boolean;
  startTime?: string;
  endTime?: string;
  progress?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

interface RawMountsResponse {
  mountPoints?: Array<string | { mountPoint?: string }>;
}

export interface RcloneRcSnapshot {
  state: RcloneRcState;
  activeTransfers: RcloneTransferJob[];
  recentTransfers: RcloneTransferJob[];
  mountPoints: string[];
}

export function resolveRcloneRcUrl(
  profile: RcloneProfileConfig,
  server: ServerConfig
) {
  if (profile.rcUrl) {
    return profile.rcUrl.replace(/\/$/, "");
  }

  if (profile.rcPort) {
    return `http://${server.host}:${profile.rcPort}`;
  }

  return `http://${server.host}:5572`;
}

async function callRc<T>(
  profile: RcloneProfileConfig,
  server: ServerConfig,
  method: string,
  body: Record<string, unknown> = {}
): Promise<T> {
  const endpoint = `${resolveRcloneRcUrl(profile, server)}/rc/${method}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (profile.username && profile.password) {
    headers.Authorization = `Basic ${Buffer.from(
      `${profile.username}:${profile.password}`
    ).toString("base64")}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || `RC request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

function normalizeStats(stats?: RawStatsResponse): RcloneStatsSnapshot {
  return {
    speed: Number(stats?.speed || 0),
    bytes: Number(stats?.bytes || 0),
    errors: Number(stats?.errors || 0),
    checks: Number(stats?.checks || stats?.totalChecks || 0),
    totalTransfers: Number(stats?.totalTransfers || 0),
    transferringCount: Array.isArray(stats?.transferring)
      ? stats?.transferring.length
      : 0,
  };
}

function parseTimestamp(value: unknown, fallback: number) {
  if (typeof value !== "string") return fallback;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function getRecordValue(record: Record<string, unknown> | undefined, keys: string[]) {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

function toStringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function normalizeActiveTransfers(
  profileId: string,
  stats: RawStatsResponse,
  jobStatuses: RawJobStatusResponse[]
): RcloneTransferJob[] {
  const transferring = Array.isArray(stats.transferring) ? stats.transferring : [];
  const count = Math.max(transferring.length, jobStatuses.length);
  const fallbackSpeed = count > 0 ? toNumber(stats.speed) / count : 0;

  return Array.from({ length: count }, (_, index) => {
    const transfer = transferring[index];
    const job = jobStatuses[index];
    const progress = job?.progress;
    const output = job?.output;
    const jobId = toNumber(job?.id, index);

    const name =
      toStringValue(getRecordValue(transfer, ["name"]), "") ||
      toStringValue(getRecordValue(progress, ["name", "remote"]), "") ||
      toStringValue(getRecordValue(output, ["name", "fs"]), `Job #${jobId}`);

    return {
      id: String(jobId || `live-${index}`),
      profileId,
      name,
      status: "running" as const,
      progress: Math.max(
        0,
        Math.min(
          100,
          toNumber(getRecordValue(transfer, ["percentage"]), toNumber(getRecordValue(progress, ["percentage"]), 0))
        )
      ),
      speed: toNumber(
        getRecordValue(transfer, ["speedAvg", "speed"]),
        toNumber(getRecordValue(progress, ["speed"]), fallbackSpeed)
      ),
      bytes: toNumber(
        getRecordValue(transfer, ["bytes"]),
        toNumber(getRecordValue(progress, ["bytes"]), 0)
      ),
      size: toNumber(
        getRecordValue(transfer, ["size"]),
        toNumber(getRecordValue(progress, ["size"]), 0)
      ),
      etaSeconds: toNumber(
        getRecordValue(transfer, ["eta"]),
        toNumber(getRecordValue(progress, ["eta"]), 0)
      ),
      startedAt: parseTimestamp(job?.startTime, Date.now()),
      stoppable: Boolean(job?.id),
      remote: toStringValue(
        getRecordValue(transfer, ["name", "dst", "src"]),
        name
      ),
      direction: toStringValue(
        getRecordValue(transfer, ["what"]),
        "transfer"
      ),
      error: toStringValue(job?.error, ""),
    };
  });
}

function normalizeRecentTransfers(
  profileId: string,
  transferred: RawTransferredResponse
): RcloneTransferJob[] {
  const items = Array.isArray(transferred.transferred)
    ? transferred.transferred
    : [];

  return items
    .map((item, index) => {
      const finishedAt = toNumber(item.timestamp, Date.now());
      const jobId = toNumber(item.jobid, index);
      const error = toStringValue(item.error, "");
      const size = toNumber(item.size, 0);
      const bytes = toNumber(item.bytes, 0);
      const status: RcloneTransferJob["status"] = error ? "error" : "success";
      return {
        id: String(jobId || `recent-${index}`),
        profileId,
        name: toStringValue(item.name, `Transfer ${index + 1}`),
        status,
        progress: error ? Math.min(99, size > 0 ? (bytes / size) * 100 : 0) : 100,
        speed: 0,
        bytes,
        size,
        startedAt: finishedAt,
        finishedAt,
        stoppable: false,
        direction: toStringValue(item.what, "transfer"),
        error: error || undefined,
      };
    })
    .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0))
    .slice(0, 10);
}

function normalizeMountPoints(data: RawMountsResponse) {
  const mountPoints = Array.isArray(data.mountPoints) ? data.mountPoints : [];
  return mountPoints
    .map((entry) =>
      typeof entry === "string" ? entry : entry.mountPoint || ""
    )
    .filter(Boolean);
}

export async function fetchRcloneRcSnapshot(
  profile: RcloneProfileConfig,
  server: ServerConfig
): Promise<RcloneRcSnapshot> {
  try {
    const [version, stats, jobs, transferred, mounts] = await Promise.all([
      callRc<RawVersionResponse>(profile, server, "core/version"),
      callRc<RawStatsResponse>(profile, server, "core/stats").catch(
        (): RawStatsResponse => ({})
      ),
      callRc<RawJobListResponse>(profile, server, "job/list").catch(
        (): RawJobListResponse => ({})
      ),
      callRc<RawTransferredResponse>(profile, server, "core/transferred").catch(
        (): RawTransferredResponse => ({ transferred: [] })
      ),
      callRc<RawMountsResponse>(profile, server, "mount/listmounts").catch(
        (): RawMountsResponse => ({ mountPoints: [] })
      ),
    ]);

    const runningIds = Array.isArray(jobs.runningIds) ? jobs.runningIds : [];
    const jobStatuses = await Promise.all(
      runningIds.slice(0, 20).map((jobId) =>
        callRc<RawJobStatusResponse>(profile, server, "job/status", { jobid: jobId }).catch(
          () => ({ id: jobId })
        )
      )
    );

    return {
      state: {
        online: true,
        version: version.version || version.decomposed?.version,
        stats: normalizeStats(stats),
      },
      activeTransfers: normalizeActiveTransfers(profile.id, stats, jobStatuses),
      recentTransfers: normalizeRecentTransfers(profile.id, transferred),
      mountPoints: normalizeMountPoints(mounts),
    };
  } catch (error) {
    return {
      state: {
        online: false,
        error: error instanceof Error ? error.message : "RC not reachable",
      },
      activeTransfers: [],
      recentTransfers: [],
      mountPoints: [],
    };
  }
}

export async function stopRcloneJob(
  profile: RcloneProfileConfig,
  server: ServerConfig,
  jobId: string
) {
  const normalizedJobId = Number(jobId.replace(/^job-/, ""));
  if (Number.isNaN(normalizedJobId)) {
    throw new Error("Invalid job id");
  }

  await callRc(profile, server, "job/stop", { jobid: normalizedJobId });
}
