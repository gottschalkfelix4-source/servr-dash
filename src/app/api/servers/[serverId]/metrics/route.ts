import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { metricsStore } from "@/lib/metrics-store";
import { pollingScheduler } from "@/lib/polling";
import { collectMetrics } from "@/lib/ssh/collect-metrics";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  pollingScheduler.start();

  let metrics = metricsStore.getLatest(serverId);
  if (!metrics) {
    const server = getConfig().servers.find((item) => item.id === serverId);
    if (!server) {
      return NextResponse.json(
        { error: "Server not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    try {
      metrics = await collectMetrics(server);
      metricsStore.push(server.id, metrics);
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error ? err.message : "Failed to collect metrics",
          code: "SSH_ERROR",
        },
        { status: 503 }
      );
    }
  }

  if (!metrics) {
    return NextResponse.json(
      { error: "No metrics available yet", code: "NO_DATA" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { metrics },
    {
      headers: { "Cache-Control": "private, no-store" },
    }
  );
}
