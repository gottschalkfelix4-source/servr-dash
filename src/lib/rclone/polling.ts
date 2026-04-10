import { getRcloneProfiles } from "@/lib/rclone/service";
import { collectRcloneProfileSnapshot } from "@/lib/rclone/service";
import { rcloneSnapshotStore } from "@/lib/rclone/store";

const POLL_INTERVAL = 10_000;

class RclonePollingScheduler {
  private started = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private refreshPromise: Promise<void> | null = null;

  start() {
    if (this.started) return;
    this.started = true;
    void this.refreshNow();
    this.timer = setInterval(() => {
      void this.refreshNow();
    }, POLL_INTERVAL);
  }

  async refreshNow(profileId?: string) {
    if (profileId) {
      await this.refresh(profileId);
      return;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.refresh().finally(() => {
      this.refreshPromise = null;
    });

    await this.refreshPromise;
  }

  private async refresh(profileId?: string) {
    const profiles = getRcloneProfiles();
    const activeProfiles = profiles.filter((profile) => profile.enabled);
    const selectedProfiles = profileId
      ? activeProfiles.filter((profile) => profile.id === profileId)
      : activeProfiles;

    const activeProfileIds = new Set(activeProfiles.map((profile) => profile.id));
    for (const existing of rcloneSnapshotStore.getProfiles()) {
      if (!activeProfileIds.has(existing.id)) {
        rcloneSnapshotStore.clearProfile(existing.id);
      }
    }

    const snapshots = await Promise.all(
      selectedProfiles.map((profile) => collectRcloneProfileSnapshot(profile))
    );

    for (const snapshot of snapshots) {
      rcloneSnapshotStore.push(
        snapshot.profile,
        snapshot.activeTransfers,
        snapshot.mounts,
        snapshot.recentTransfers
      );
    }
  }
}

const globalKey = "__rclonePollingScheduler__" as const;
export const rclonePollingScheduler: RclonePollingScheduler =
  (globalThis as Record<string, unknown>)[globalKey] as RclonePollingScheduler ??
  ((globalThis as Record<string, unknown>)[globalKey] = new RclonePollingScheduler());
