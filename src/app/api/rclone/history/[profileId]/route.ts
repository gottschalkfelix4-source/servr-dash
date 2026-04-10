import { NextResponse } from "next/server";
import { rclonePollingScheduler } from "@/lib/rclone/polling";
import { rcloneSnapshotStore } from "@/lib/rclone/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;
  rclonePollingScheduler.start();

  if (!rcloneSnapshotStore.getProfile(profileId)) {
    await rclonePollingScheduler.refreshNow(profileId);
  }

  return NextResponse.json({
    history: rcloneSnapshotStore.getHistory(profileId),
  });
}
