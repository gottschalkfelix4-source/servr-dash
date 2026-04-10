import { describe, expect, it } from "vitest";
import { RcloneSnapshotStore } from "@/lib/rclone/store";

describe("RcloneSnapshotStore", () => {
  it("keeps history points and tracks recently completed transfers", () => {
    const store = new RcloneSnapshotStore();

    store.push(
      {
        id: "media",
        name: "Media",
        serverId: "srv-1",
        serverName: "Host",
        status: "online",
        enabled: true,
        checkedAt: 1710000000000,
        rcOnline: true,
        mountsOnline: 1,
        mountsDegraded: 0,
        mountsTotal: 1,
        activeTransfers: 1,
        lastError: null,
        stats: {
          speed: 1000,
          transferringCount: 1,
          totalTransfers: 1,
          errors: 0,
          bytes: 10,
          checks: 0,
        },
      },
      [
        {
          id: "job-1",
          profileId: "media",
          name: "copy media",
          status: "running",
          progress: 50,
          speed: 1000,
          bytes: 50,
          size: 100,
          startedAt: 1710000000000,
        },
      ]
    );

    store.push(
      {
        id: "media",
        name: "Media",
        serverId: "srv-1",
        serverName: "Host",
        status: "online",
        enabled: true,
        checkedAt: 1710000005000,
        rcOnline: true,
        mountsOnline: 1,
        mountsDegraded: 0,
        mountsTotal: 1,
        activeTransfers: 0,
        lastError: null,
        stats: {
          speed: 0,
          transferringCount: 0,
          totalTransfers: 2,
          errors: 0,
          bytes: 100,
          checks: 0,
        },
      },
      []
    );

    const history = store.getHistory("media");
    const recent = store.getRecentTransfers();

    expect(history).toHaveLength(2);
    expect(history[0].activeTransfers).toBe(1);
    expect(history[1].activeTransfers).toBe(0);
    expect(recent[0]?.status).toBe("success");
    expect(recent[0]?.finishedAt).toBe(1710000005000);
  });
});
