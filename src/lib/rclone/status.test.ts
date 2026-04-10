import { describe, expect, it } from "vitest";
import {
  buildRcloneOverview,
  summarizeRcloneProfile,
} from "@/lib/rclone/status";

describe("summarizeRcloneProfile", () => {
  it("marks a profile online when rc and mounts are healthy", () => {
    const result = summarizeRcloneProfile({
      profile: {
        id: "media",
        name: "Media Sync",
        serverId: "srv-1",
        enabled: true,
        mounts: [
          { id: "movies", label: "Movies", path: "/mnt/movies" },
          { id: "tv", label: "TV", path: "/mnt/tv" },
        ],
      },
      serverName: "Storage Box",
      serverConnected: true,
      rc: {
        online: true,
        version: "v1.68.0",
        stats: {
          speed: 1048576,
          transferringCount: 2,
          totalTransfers: 9,
          errors: 0,
          bytes: 52428800,
          checks: 11,
        },
      },
      mounts: [
        {
          profileId: "media",
          mountId: "movies",
          label: "Movies",
          path: "/mnt/movies",
          source: "manual",
          status: "online",
          isMounted: true,
          lastChecked: 1710000000000,
        },
        {
          profileId: "media",
          mountId: "tv",
          label: "TV",
          path: "/mnt/tv",
          source: "manual",
          status: "online",
          isMounted: true,
          lastChecked: 1710000000000,
        },
      ],
      checkedAt: 1710000000000,
      activeTransfers: [
        {
          id: "job-1",
          profileId: "media",
          name: "sync movies",
          status: "running",
          progress: 42,
          speed: 1048576,
          bytes: 1024,
          size: 2048,
          startedAt: 1710000000000,
        },
      ],
    });

    expect(result.status).toBe("online");
    expect(result.mountsOnline).toBe(2);
    expect(result.mountsTotal).toBe(2);
    expect(result.activeTransfers).toBe(1);
    expect(result.stats.speed).toBe(1048576);
  });

  it("marks a profile warning when rc is online but a mount is degraded", () => {
    const result = summarizeRcloneProfile({
      profile: {
        id: "backup",
        name: "Backup",
        serverId: "srv-1",
        enabled: true,
        mounts: [{ id: "archive", label: "Archive", path: "/mnt/archive" }],
      },
      serverName: "Storage Box",
      serverConnected: true,
      rc: {
        online: true,
        stats: {
          speed: 0,
          transferringCount: 0,
          totalTransfers: 1,
          errors: 0,
          bytes: 0,
          checks: 0,
        },
      },
      mounts: [
        {
          profileId: "backup",
          mountId: "archive",
          label: "Archive",
          path: "/mnt/archive",
          source: "manual",
          status: "warning",
          isMounted: false,
          lastChecked: 1710000000000,
          error: "Mount path not mounted",
        },
      ],
      checkedAt: 1710000000000,
      activeTransfers: [],
    });

    expect(result.status).toBe("warning");
    expect(result.mountsDegraded).toBe(1);
  });

  it("marks a profile offline when rc and server are both unreachable", () => {
    const result = summarizeRcloneProfile({
      profile: {
        id: "cold",
        name: "Cold Storage",
        serverId: "srv-2",
        enabled: true,
        mounts: [],
      },
      serverName: "Offline Host",
      serverConnected: false,
      rc: {
        online: false,
        error: "Connection refused",
      },
      mounts: [],
      checkedAt: 1710000000000,
      activeTransfers: [],
    });

    expect(result.status).toBe("offline");
    expect(result.lastError).toContain("Connection refused");
  });
});

describe("buildRcloneOverview", () => {
  it("aggregates counts and throughput across profiles", () => {
    const overview = buildRcloneOverview([
      {
        id: "one",
        name: "One",
        serverId: "srv-1",
        serverName: "Host 1",
        status: "online",
        enabled: true,
        checkedAt: 1710000000000,
        rcOnline: true,
        mountsOnline: 2,
        mountsDegraded: 0,
        mountsTotal: 2,
        activeTransfers: 1,
        lastError: null,
        stats: {
          speed: 1000,
          transferringCount: 1,
          totalTransfers: 4,
          errors: 0,
          bytes: 100,
          checks: 1,
        },
      },
      {
        id: "two",
        name: "Two",
        serverId: "srv-2",
        serverName: "Host 2",
        status: "warning",
        enabled: true,
        checkedAt: 1710000000000,
        rcOnline: true,
        mountsOnline: 1,
        mountsDegraded: 1,
        mountsTotal: 2,
        activeTransfers: 2,
        lastError: "Mount issue",
        stats: {
          speed: 2000,
          transferringCount: 2,
          totalTransfers: 6,
          errors: 1,
          bytes: 200,
          checks: 2,
        },
      },
    ]);

    expect(overview.profileCount).toBe(2);
    expect(overview.onlineProfiles).toBe(1);
    expect(overview.warningProfiles).toBe(1);
    expect(overview.activeTransfers).toBe(3);
    expect(overview.mountsHealthy).toBe(3);
    expect(overview.mountsTotal).toBe(4);
    expect(overview.totalSpeed).toBe(3000);
    expect(overview.lastErrors).toContain("Mount issue");
  });
});
