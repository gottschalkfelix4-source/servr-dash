import { describe, expect, it } from "vitest";
import {
  mergeDiscoveredMounts,
  normalizeDiscoveredSshMounts,
} from "@/lib/rclone/mounts";

describe("normalizeDiscoveredSshMounts", () => {
  it("extracts rclone-like fuse mounts from ssh output", () => {
    const output = [
      "/mnt/media|fuse.rclone|media-remote:",
      "/mnt/backup|fuse|backup:",
      "/srv/data|ext4|/dev/sda1",
      "",
    ].join("\n");

    expect(normalizeDiscoveredSshMounts(output)).toEqual([
      {
        path: "/mnt/media",
        label: "media",
        remoteName: "media-remote:",
        mode: "unknown",
        discoveredBy: "ssh",
      },
      {
        path: "/mnt/backup",
        label: "backup",
        remoteName: "backup:",
        mode: "unknown",
        discoveredBy: "ssh",
      },
    ]);
  });
});

describe("mergeDiscoveredMounts", () => {
  it("keeps configured mounts and appends newly discovered ones", () => {
    const merged = mergeDiscoveredMounts(
      [
        {
          id: "media",
          label: "Media",
          path: "/mnt/media",
          remoteName: "media-remote:",
          mode: "rw",
        },
      ],
      [
        {
          path: "/mnt/media",
          label: "media",
          remoteName: "media-remote:",
          mode: "unknown",
          discoveredBy: "ssh",
        },
        {
          path: "/mnt/archive",
          label: "archive",
          remoteName: "archive:",
          mode: "unknown",
          discoveredBy: "ssh",
        },
      ]
    );

    expect(merged).toEqual([
      {
        id: "media",
        label: "Media",
        path: "/mnt/media",
        remoteName: "media-remote:",
        mode: "rw",
        source: "manual",
      },
      {
        id: "discovered-mnt-archive",
        label: "archive",
        path: "/mnt/archive",
        remoteName: "archive:",
        mode: "unknown",
        source: "discovered",
        discoveredBy: "ssh",
      },
    ]);
  });
});
