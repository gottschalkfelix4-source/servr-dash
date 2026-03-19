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

  const headers: Record<string, string> = {
    "Accept": "application/json",
  };
  if (openclaw.authMethod === "token" && openclaw.token) {
    headers["Authorization"] = `Bearer ${openclaw.token}`;
    log("Auth Header: Bearer Token");
  } else if (openclaw.authMethod === "password" && openclaw.password) {
    headers["Authorization"] = `Bearer ${openclaw.password}`;
    log(`Auth Header: Bearer ***${openclaw.password.slice(-4)}`);
  } else {
    log("Auth Header: keiner (keine Auth)");
  }

  const baseUrl = openclaw.url.replace(/\/$/, "");

  // Step 1: Try /v1/models
  try {
    log(`Teste: GET ${baseUrl}/v1/models ...`);
    const modelsRes = await fetch(`${baseUrl}/v1/models`, {
      headers,
      signal: AbortSignal.timeout(5000),
    });

    log(`/v1/models → Status ${modelsRes.status} ${modelsRes.statusText}`);

    if (modelsRes.ok) {
      const contentType = modelsRes.headers.get("content-type") || "";
      const body = await modelsRes.text();

      if (contentType.includes("application/json") || body.trimStart().startsWith("{") || body.trimStart().startsWith("[")) {
        try {
          const data = JSON.parse(body);
          const models = data.data?.map((m: { id: string }) => m.id) || [];
          log(`Modelle gefunden: ${models.join(", ") || "keine"}`);
          log("Verbindung erfolgreich!");
          return NextResponse.json({ configured: true, online: true, models, logs });
        } catch (e) {
          log(`JSON Parse Fehler: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      // Got HTML back — likely gateway login page, auth failed
      if (body.includes("<!doctype") || body.includes("<html")) {
        log("Gateway gibt HTML zurück statt JSON → Auth fehlgeschlagen");
        log("→ Prüfe ob dein Passwort korrekt ist");
        log("→ Prüfe ob die OpenAI HTTP API im Gateway aktiviert ist");
        log("  (openclaw.json: gateway.apiServer.enabled: true)");
      } else {
        log(`Unerwartete Response: ${body.substring(0, 200)}`);
      }
    } else {
      const errText = await modelsRes.text().catch(() => "");
      if (errText) log(`Response: ${errText.substring(0, 200)}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`/v1/models Fehler: ${msg}`);
  }

  // Step 2: Try raw connectivity (just fetch the base URL, no chat created)
  try {
    log(`Teste: GET ${baseUrl}/ ...`);
    const rootRes = await fetch(`${baseUrl}/`, {
      headers,
      signal: AbortSignal.timeout(3000),
    });
    log(`Root → Status ${rootRes.status} ${rootRes.statusText}`);
    const body = await rootRes.text().catch(() => "");
    if (body) log(`Root Response: ${body.substring(0, 200)}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`Root Fehler: ${msg}`);
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
