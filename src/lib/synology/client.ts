import { getConfig } from "@/lib/config";
import type {
  SynologyConfig,
  SynologySession,
  ABBDevice,
  ABBTask,
  ABBLogEntry,
  ABBOverview,
} from "@/types/synology";

// In-memory session cache
let cachedSession: SynologySession | null = null;

function getSynologyConfig(): SynologyConfig | null {
  const config = getConfig();
  const syn = config.synology as SynologyConfig | undefined;
  if (!syn?.url || !syn?.username || !syn?.password) return null;
  return syn;
}

class SynologyABBClient {
  private async getSession(): Promise<string> {
    const cfg = getSynologyConfig();
    if (!cfg) throw new Error("Synology nicht konfiguriert");

    // Return cached session if still valid (with 5min buffer)
    if (cachedSession && cachedSession.expiresAt > Date.now() + 300000) {
      return cachedSession.sid;
    }

    const params = new URLSearchParams({
      api: "SYNO.API.Auth",
      version: "3",
      method: "login",
      account: cfg.username,
      passwd: cfg.password,
      format: "sid",
    });

    const res = await fetch(`${cfg.url}/webapi/auth.cgi?${params}`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Synology Auth HTTP ${res.status}`);

    const data = await res.json();
    if (!data.success) {
      throw new Error(
        `Synology Auth fehlgeschlagen: Code ${data.error?.code || "unbekannt"}`
      );
    }

    cachedSession = {
      sid: data.data.sid,
      expiresAt: Date.now() + 6 * 24 * 60 * 60 * 1000, // 6 days
    };

    return cachedSession.sid;
  }

  private async apiCall<T>(
    api: string,
    method: string,
    extraParams: Record<string, string> = {},
    version = "1"
  ): Promise<T> {
    const cfg = getSynologyConfig();
    if (!cfg) throw new Error("Synology nicht konfiguriert");

    const sid = await this.getSession();

    const params = new URLSearchParams({
      api,
      version,
      method,
      _sid: sid,
      ...extraParams,
    });

    const res = await fetch(`${cfg.url}/webapi/entry.cgi?${params}`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Synology API HTTP ${res.status}`);

    const data = await res.json();

    if (!data.success) {
      // Session expired — clear cache and retry once
      if (data.error?.code === 119 || data.error?.code === 105) {
        cachedSession = null;
        const newSid = await this.getSession();
        const retryParams = new URLSearchParams({
          api,
          version,
          method,
          _sid: newSid,
          ...extraParams,
        });

        const retryRes = await fetch(
          `${cfg.url}/webapi/entry.cgi?${retryParams}`,
          { cache: "no-store" }
        );
        const retryData = await retryRes.json();
        if (!retryData.success) {
          throw new Error(
            `Synology API Fehler: ${api} Code ${retryData.error?.code}`
          );
        }
        return retryData.data as T;
      }

      throw new Error(`Synology API Fehler: ${api} Code ${data.error?.code}`);
    }

    return data.data as T;
  }

  // --- Public API ---

  async testConnection(): Promise<{ success: boolean; version?: string }> {
    try {
      const cfg = getSynologyConfig();
      if (!cfg) return { success: false };

      await this.getSession();

      // Try to get ABB activation status
      try {
        await this.apiCall("SYNO.ActiveBackup.Activation", "get");
      } catch {
        // ABB might not be installed
      }

      return { success: true };
    } catch {
      return { success: false };
    }
  }

  async getDevices(): Promise<ABBDevice[]> {
    try {
      const data = await this.apiCall<{
        device_list?: ABBDevice[];
        data?: ABBDevice[];
        devices?: ABBDevice[];
      }>("SYNO.ActiveBackup.Device", "list", {
        limit: "100",
        offset: "0",
      });
      return data.device_list || data.data || data.devices || [];
    } catch (err) {
      console.error("ABB getDevices error:", err);
      return [];
    }
  }

  async getTasks(): Promise<ABBTask[]> {
    try {
      const data = await this.apiCall<{
        task_list?: ABBTask[];
        data?: ABBTask[];
        tasks?: ABBTask[];
      }>("SYNO.ActiveBackup.Task", "list", {
        limit: "100",
        offset: "0",
      });
      return data.task_list || data.data || data.tasks || [];
    } catch (err) {
      console.error("ABB getTasks error:", err);
      return [];
    }
  }

  async getLogs(limit = 50): Promise<ABBLogEntry[]> {
    try {
      const data = await this.apiCall<{
        log_list?: ABBLogEntry[];
        data?: ABBLogEntry[];
        logs?: ABBLogEntry[];
        result_list?: ABBLogEntry[];
      }>("SYNO.ActiveBackup.Log", "list_result", {
        limit: String(limit),
        offset: "0",
      });
      return (
        data.result_list || data.log_list || data.data || data.logs || []
      );
    } catch (err) {
      console.error("ABB getLogs error:", err);
      return [];
    }
  }

  async getOverview(): Promise<ABBOverview> {
    const [devices, tasks, logs] = await Promise.all([
      this.getDevices(),
      this.getTasks(),
      this.getLogs(100),
    ]);

    const now = Date.now() / 1000;
    const last24h = now - 86400;

    const onlineDevices = devices.filter((d) => d.status === 1 || d.status === 2);
    const recentLogs = logs.filter((l) => l.time_end > last24h);

    const successCount = recentLogs.filter((l) => l.status === 1).length;
    const warningCount = recentLogs.filter((l) => l.status === 2).length;
    const errorCount = recentLogs.filter((l) => l.status === 3).length;

    const totalSize = devices.reduce(
      (sum, d) => sum + (d.total_backup_size || 0),
      0
    );

    return {
      total_devices: devices.length,
      online_devices: onlineDevices.length,
      offline_devices: devices.length - onlineDevices.length,
      total_tasks: tasks.length,
      active_tasks: tasks.filter((t) => t.status === 1 || t.status === 2).length,
      success_count: successCount,
      warning_count: warningCount,
      error_count: errorCount,
      last_24h_backups: recentLogs.length,
      total_backup_size: totalSize,
    };
  }

  isConfigured(): boolean {
    return !!getSynologyConfig();
  }

  clearSession(): void {
    cachedSession = null;
  }
}

export const synologyClient = new SynologyABBClient();
