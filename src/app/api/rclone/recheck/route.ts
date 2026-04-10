import { NextResponse } from "next/server";
import { rclonePollingScheduler } from "@/lib/rclone/polling";
import { rcloneSnapshotStore } from "@/lib/rclone/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const profileId =
    typeof body.profileId === "string" && body.profileId.trim()
      ? body.profileId
      : undefined;

  await rclonePollingScheduler.refreshNow(profileId);

  return NextResponse.json({
    overview: rcloneSnapshotStore.getOverview(),
    profiles: profileId
      ? [rcloneSnapshotStore.getProfile(profileId)].filter(Boolean)
      : rcloneSnapshotStore.getProfiles(),
    mounts: profileId
      ? rcloneSnapshotStore.getMounts(profileId)
      : rcloneSnapshotStore.getMounts(),
  });
}
