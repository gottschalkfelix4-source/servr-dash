import { NextResponse } from "next/server";
import { rclonePollingScheduler } from "@/lib/rclone/polling";
import { stopRcloneProfileJob } from "@/lib/rclone/service";
import { rcloneSnapshotStore } from "@/lib/rclone/store";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const body = await request.json().catch(() => ({}));
  const profileId =
    typeof body.profileId === "string" && body.profileId.trim()
      ? body.profileId
      : "";

  if (!profileId) {
    return NextResponse.json(
      { error: "profileId is required" },
      { status: 400 }
    );
  }

  try {
    await stopRcloneProfileJob(profileId, jobId);
    await rclonePollingScheduler.refreshNow(profileId);

    return NextResponse.json({
      success: true,
      active: rcloneSnapshotStore.getActiveTransfers(),
      recent: rcloneSnapshotStore.getRecentTransfers(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to stop job" },
      { status: 400 }
    );
  }
}
