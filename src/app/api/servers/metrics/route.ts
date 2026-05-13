import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { metricsStore } from "@/lib/metrics-store";
import { pollingScheduler } from "@/lib/polling";
import { collectMetrics } from "@/lib/ssh/collect-metrics";

export async function GET() {
  pollingScheduler.start();
  const config = getConfig();
  const metrics = metricsStore.getLatestForAll();

  await Promise.all(
    config.servers.map(async (server) => {
      if (metrics[server.id]) return;
      try {
        const collected = await collectMetrics(server);
        metricsStore.push(server.id, collected);
        metrics[server.id] = collected;
      } catch (err) {
        console.error(
          `[Metrics] Initial collection failed for ${server.name}:`,
          err instanceof Error ? err.message : err
        );
      }
    })
  );

  return NextResponse.json(
    { metrics },
    {
      headers: {
        "Cache-Control": "private, max-age=3, stale-while-revalidate=2",
      },
    }
  );
}
