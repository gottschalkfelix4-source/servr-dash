import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getConfig();
  const openclaw = config.openclaw;

  if (!openclaw?.url) {
    return NextResponse.json({ configured: false, online: false });
  }

  try {
    const headers: Record<string, string> = {};
    if (openclaw.token) {
      headers["Authorization"] = `Bearer ${openclaw.token}`;
    }

    // Try to fetch models list to verify connection
    const res = await fetch(`${openclaw.url.replace(/\/$/, "")}/v1/models`, {
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      const models = data.data?.map((m: { id: string }) => m.id) || [];
      return NextResponse.json({
        configured: true,
        online: true,
        models,
      });
    }

    return NextResponse.json({ configured: true, online: false });
  } catch {
    return NextResponse.json({ configured: true, online: false });
  }
}
