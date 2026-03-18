import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import type { SynologyConfig } from "@/types/synology";

export const dynamic = "force-dynamic";

// Debug endpoint: returns raw API responses from Synology
export async function GET() {
  const config = getConfig();
  const cfg = config.synology as SynologyConfig | undefined;
  if (!cfg?.url || !cfg?.username) {
    return NextResponse.json({ error: "Not configured" }, { status: 400 });
  }

  const results: Record<string, unknown> = {};

  try {
    // Login
    const loginParams = new URLSearchParams({
      api: "SYNO.API.Auth",
      version: "6",
      method: "login",
      account: cfg.username,
      passwd: cfg.password,
      format: "sid",
      ...(cfg.deviceId ? { device_id: cfg.deviceId } : {}),
    });

    const loginRes = await fetch(`${cfg.url}/webapi/auth.cgi?${loginParams}`, {
      cache: "no-store",
    });
    const loginData = await loginRes.json();
    results.login = { success: loginData.success, hasData: !!loginData.data };

    if (!loginData.success) {
      results.loginError = loginData.error;
      return NextResponse.json(results);
    }

    const sid = loginData.data.sid;

    // Query available APIs
    const infoParams = new URLSearchParams({
      api: "SYNO.API.Info",
      version: "1",
      method: "query",
      query: "SYNO.ActiveBackup",
      _sid: sid,
    });
    const infoRes = await fetch(`${cfg.url}/webapi/query.cgi?${infoParams}`, {
      cache: "no-store",
    });
    const infoData = await infoRes.json();
    results.availableApis = infoData.success ? Object.keys(infoData.data || {}) : infoData;

    // Try different API calls and return RAW responses
    const apis = [
      { api: "SYNO.ActiveBackup.Device", method: "list" },
      { api: "SYNO.ActiveBackup.Task", method: "list" },
      { api: "SYNO.ActiveBackup.Log", method: "list_result" },
      { api: "SYNO.ActiveBackup.Overview", method: "get" },
      { api: "SYNO.ActiveBackup.Activation", method: "get" },
    ];

    for (const { api, method } of apis) {
      try {
        const params = new URLSearchParams({
          api,
          version: "1",
          method,
          _sid: sid,
          limit: "5",
          offset: "0",
        });

        const res = await fetch(`${cfg.url}/webapi/entry.cgi?${params}`, {
          cache: "no-store",
        });
        const data = await res.json();
        results[api] = data;
      } catch (err) {
        results[api] = { error: String(err) };
      }
    }
  } catch (err) {
    results.error = String(err);
  }

  return NextResponse.json(results);
}
