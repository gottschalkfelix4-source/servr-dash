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
    if (openclaw.authMethod === "token" && openclaw.token) {
      headers["Authorization"] = `Bearer ${openclaw.token}`;
    } else if (openclaw.authMethod === "password" && openclaw.password) {
      headers["Authorization"] = `Bearer ${openclaw.password}`;
    }

    // Try a simple completions call to verify connection
    // /v1/models may not be available on all OpenClaw setups
    const baseUrl = openclaw.url.replace(/\/$/, "");

    // Try /v1/models first
    const modelsRes = await fetch(`${baseUrl}/v1/models`, {
      headers,
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);

    if (modelsRes?.ok) {
      const data = await modelsRes.json();
      const models = data.data?.map((m: { id: string }) => m.id) || [];
      return NextResponse.json({ configured: true, online: true, models });
    }

    // Fallback: try a minimal chat completions request
    const chatRes = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: openclaw.model || "openclaw",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
      }),
      signal: AbortSignal.timeout(10000),
    }).catch(() => null);

    if (chatRes?.ok || chatRes?.status === 200) {
      return NextResponse.json({ configured: true, online: true, models: ["openclaw"] });
    }

    return NextResponse.json({ configured: true, online: false });
  } catch {
    return NextResponse.json({ configured: true, online: false });
  }
}
