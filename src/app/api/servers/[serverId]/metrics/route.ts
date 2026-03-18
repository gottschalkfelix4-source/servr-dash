import { NextResponse } from "next/server";
import { metricsStore } from "@/lib/metrics-store";
import { pollingScheduler } from "@/lib/polling";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  pollingScheduler.start();

  const metrics = metricsStore.getLatest(serverId);
  if (!metrics) {
    return NextResponse.json(
      { error: "No metrics available yet", code: "NO_DATA" },
      { status: 404 }
    );
  }

  return NextResponse.json({ metrics }, {
    headers: { "Cache-Control": "private, max-age=3, stale-while-revalidate=2" },
  });
}
