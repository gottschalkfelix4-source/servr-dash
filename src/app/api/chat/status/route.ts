import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getConfig();
  const openclaw = config.openclaw;
  const logs: string[] = [];

  const log = (msg: string) => {
    const ts = new Date().toLocaleTimeString("de-DE");
    logs.push(`[${ts}] ${msg}`);
  };

  if (!openclaw?.url) {
    log("Keine Gateway URL konfiguriert");
    return NextResponse.json({ configured: false, online: false, logs });
  }

  log(`Gateway URL: ${openclaw.url}`);
  log(`Auth: ${openclaw.authMethod || "none"}`);
  if (openclaw.password) log("Passwort: gesetzt");
  if (openclaw.model) log(`Modell: ${openclaw.model}`);

  const baseUrl = openclaw.url.replace(/\/$/, "");

  // Simple connectivity check: just see if the gateway is reachable
  // We don't use /v1/models because OpenClaw Gateway doesn't support it
  // and returns HTML instead. The chat endpoint works fine with Bearer auth.
  try {
    log(`Teste: GET ${baseUrl}/ ...`);
    const rootRes = await fetch(`${baseUrl}/`, {
      signal: AbortSignal.timeout(5000),
    });

    log(`Root → Status ${rootRes.status} ${rootRes.statusText}`);

    if (rootRes.ok) {
      const body = await rootRes.text().catch(() => "");
      if (body.includes("OpenClaw") || body.includes("openclaw") || body.includes("<!doctype")) {
        log("Gateway erreichbar!");
        log("Verbindung erfolgreich.");
        return NextResponse.json({
          configured: true,
          online: true,
          models: [openclaw.model || "openclaw"],
          logs,
        });
      }
      log(`Unerwartete Response: ${body.substring(0, 200)}`);
    } else {
      log(`Fehler: HTTP ${rootRes.status}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`Fehler: ${msg}`);
    if (msg.includes("ECONNREFUSED")) {
      log("→ Server läuft nicht oder Port ist falsch");
    } else if (msg.includes("ETIMEDOUT") || msg.includes("timeout")) {
      log("→ Server nicht erreichbar (Firewall? Falsches Netzwerk?)");
    } else if (msg.includes("ENOTFOUND")) {
      log("→ Hostname nicht auflösbar (DNS-Problem)");
    }
  }

  log("Verbindung fehlgeschlagen.");
  return NextResponse.json({ configured: true, online: false, logs });
}
