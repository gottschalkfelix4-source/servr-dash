import { NextResponse } from "next/server";
import { metricsStore } from "@/lib/metrics-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  const history = metricsStore.getHistory(serverId);
  return NextResponse.json({ history }, {
    headers: { "Cache-Control": "private, max-age=3, stale-while-revalidate=2" },
  });
}
