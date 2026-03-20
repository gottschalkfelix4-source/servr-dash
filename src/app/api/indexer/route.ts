import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { fetchIndexerStats } from "@/lib/indexer/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getConfig();
  const indexers = (config as Record<string, unknown>).indexers as
    | { name: string; url: string; apiKey: string }[]
    | undefined;

  if (!indexers || indexers.length === 0) {
    return NextResponse.json({ indexers: [] });
  }

  const results = await Promise.all(
    indexers.map(async (indexer) => {
      try {
        const stats = await fetchIndexerStats(indexer);
        return { name: indexer.name, url: indexer.url, ...stats };
      } catch (err) {
        return {
          name: indexer.name,
          url: indexer.url,
          online: false,
          error: err instanceof Error ? err.message : "Unbekannter Fehler",
          user: null,
          limits: null,
          caps: null,
        };
      }
    })
  );

  return NextResponse.json({ indexers: results });
}
