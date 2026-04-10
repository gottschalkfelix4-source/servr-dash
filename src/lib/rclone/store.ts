import { buildRcloneOverview } from "@/lib/rclone/status";
import type {
  RcloneHistoryPoint,
  RcloneMountStatus,
  RcloneOverview,
  RcloneProfileStatus,
  RcloneTransferJob,
} from "@/types/rclone";

const BUFFER_SIZE = 60;
const RECENT_TRANSFER_LIMIT = 20;

class HistoryBuffer {
  private buffer: RcloneHistoryPoint[] = [];
  private head = 0;
  private count = 0;

  push(item: RcloneHistoryPoint) {
    if (this.count < BUFFER_SIZE) {
      this.buffer.push(item);
      this.count += 1;
    } else {
      this.buffer[this.head] = item;
    }

    this.head = (this.head + 1) % BUFFER_SIZE;
  }

  getAll() {
    if (this.count < BUFFER_SIZE) {
      return [...this.buffer];
    }

    return [
      ...this.buffer.slice(this.head),
      ...this.buffer.slice(0, this.head),
    ];
  }
}

export class RcloneSnapshotStore {
  private latestProfiles = new Map<string, RcloneProfileStatus>();
  private latestMounts = new Map<string, RcloneMountStatus[]>();
  private historyBuffers = new Map<string, HistoryBuffer>();
  private activeTransfers = new Map<string, RcloneTransferJob>();
  private recentTransfers: RcloneTransferJob[] = [];

  push(
    profile: RcloneProfileStatus,
    transfers: RcloneTransferJob[],
    mounts: RcloneMountStatus[] = [],
    recentTransfers: RcloneTransferJob[] = []
  ) {
    this.latestProfiles.set(profile.id, profile);
    this.latestMounts.set(profile.id, mounts);

    if (!this.historyBuffers.has(profile.id)) {
      this.historyBuffers.set(profile.id, new HistoryBuffer());
    }

    this.historyBuffers.get(profile.id)?.push({
      timestamp: profile.checkedAt,
      speed: profile.stats.speed,
      activeTransfers: profile.activeTransfers,
      errors: profile.stats.errors,
      mountsHealthy: profile.mountsOnline,
      mountsDegraded: profile.mountsDegraded,
    });

    const nextKeys = new Set<string>();
    for (const transfer of transfers) {
      const key = this.getTransferKey(profile.id, transfer.id);
      nextKeys.add(key);
      this.activeTransfers.set(key, transfer);
    }

    for (const [key, transfer] of [...this.activeTransfers.entries()]) {
      if (transfer.profileId !== profile.id || nextKeys.has(key)) {
        continue;
      }

      this.activeTransfers.delete(key);
      this.pushRecentTransfer({
        ...transfer,
        status: transfer.error ? "error" : "success",
        progress: transfer.error ? transfer.progress : 100,
        speed: 0,
        finishedAt: profile.checkedAt,
      });
    }

    for (const transfer of recentTransfers) {
      this.pushRecentTransfer(transfer);
    }
  }

  getProfiles() {
    return [...this.latestProfiles.values()];
  }

  getProfile(profileId: string) {
    return this.latestProfiles.get(profileId);
  }

  getMounts(profileId?: string) {
    if (profileId) {
      return this.latestMounts.get(profileId) ?? [];
    }

    return [...this.latestMounts.values()].flat();
  }

  getHistory(profileId: string) {
    return this.historyBuffers.get(profileId)?.getAll() ?? [];
  }

  getActiveTransfers() {
    return [...this.activeTransfers.values()].sort(
      (a, b) => b.startedAt - a.startedAt
    );
  }

  getRecentTransfers(limit = RECENT_TRANSFER_LIMIT) {
    return this.recentTransfers.slice(0, limit);
  }

  getOverview(): RcloneOverview {
    return buildRcloneOverview(this.getProfiles());
  }

  clearProfile(profileId: string) {
    this.latestProfiles.delete(profileId);
    this.latestMounts.delete(profileId);
    this.historyBuffers.delete(profileId);

    for (const [key, transfer] of [...this.activeTransfers.entries()]) {
      if (transfer.profileId === profileId) {
        this.activeTransfers.delete(key);
      }
    }
  }

  private getTransferKey(profileId: string, transferId: string) {
    return `${profileId}:${transferId}`;
  }

  private pushRecentTransfer(transfer: RcloneTransferJob) {
    const transferKey = `${transfer.profileId}:${transfer.id}:${transfer.finishedAt ?? 0}:${transfer.status}`;
    if (
      this.recentTransfers.some(
        (existing) =>
          `${existing.profileId}:${existing.id}:${existing.finishedAt ?? 0}:${existing.status}` ===
          transferKey
      )
    ) {
      return;
    }

    this.recentTransfers.unshift(transfer);
    this.recentTransfers = this.recentTransfers.slice(0, RECENT_TRANSFER_LIMIT);
  }
}

const globalKey = "__rcloneSnapshotStore__" as const;
export const rcloneSnapshotStore: RcloneSnapshotStore =
  (globalThis as Record<string, unknown>)[globalKey] as RcloneSnapshotStore ??
  ((globalThis as Record<string, unknown>)[globalKey] = new RcloneSnapshotStore());
