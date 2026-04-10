import { NextResponse } from "next/server";
import { getRcloneProfiles } from "@/lib/rclone/service";
import { rclonePollingScheduler } from "@/lib/rclone/polling";
import { rcloneSnapshotStore } from "@/lib/rclone/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const profiles = getRcloneProfiles().filter((profile) => profile.enabled);
  rclonePollingScheduler.start();

  if (profiles.length > 0 && rcloneSnapshotStore.getMounts().length === 0) {
    await rclonePollingScheduler.refreshNow();
  }

  return NextResponse.json({
    mounts: rcloneSnapshotStore.getMounts(),
  });
}
