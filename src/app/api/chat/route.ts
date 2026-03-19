import { NextRequest } from "next/server";
import { getConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const config = getConfig();
  const openclaw = config.openclaw;

  if (!openclaw?.url) {
    return new Response(
      JSON.stringify({ error: "OpenClaw Gateway nicht konfiguriert" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const { messages, stream = true } = body;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (openclaw.authMethod === "token" && openclaw.token) {
      headers["Authorization"] = `Bearer ${openclaw.token}`;
    } else if (openclaw.authMethod === "password" && openclaw.password) {
      headers["Authorization"] = `Bearer ${openclaw.password}`;
    }

    const gatewayUrl = `${openclaw.url.replace(/\/$/, "")}/v1/chat/completions`;

    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: openclaw.model || "default",
        messages,
        stream,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: `Gateway error: ${response.status} - ${errText}` }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    if (stream && response.body) {
      // Forward SSE stream directly
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming response
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Gateway nicht erreichbar",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
