import { getConfig, saveConfig } from "@/lib/config";
import type {
  SynologyConfig,
  SynologySession,
  ABBDeviceRaw,
  ABBTaskRaw,
  ABBLogRaw,
  ABBDevice,
  ABBTask,
  ABBLogEntry,
  ABBOverview,
} from "@/types/synology";
import {
  getBackupTypeLabel,
  getLogStatusLabel,
  getScheduleLabel,
} from "@/types/synology";

// In-memory session cache
let cachedSession: SynologySession | null = null;

function getSynologyConfig(): SynologyConfig | null {
  const config = getConfig();
  const syn = config.synology as SynologyConfig | undefined;
  if (!syn?.url || !syn?.username || !syn?.password) return null;
  return syn;
}

export class TwoFactorRequiredError extends Error {
  constructor() {
    super("2FA_REQUIRED");
    this.name = "TwoFactorRequiredError";
  }
}

class SynologyABBClient {
  private async getSession(): Promise<string> {
    const cfg = getSynologyConfig();
    if (!cfg) throw new Error("Synology nicht konfiguriert");

    if (cachedSession && cachedSession.expiresAt > Date.now() + 300000) {
      return cachedSession.sid;
    }

    const params = new URLSearchParams({
      api: "SYNO.API.Auth",
      version: "6",
      method: "login",
      account: cfg.username,
      passwd: cfg.password,
      format: "sid",
    });

    if (cfg.deviceId) {
      params.set("device_id", cfg.deviceId);
    }

    const res = await fetch(`${cfg.url}/webapi/auth.cgi?${params}`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Synology Auth HTTP ${res.status}`);

    const data = await res.json();

    if (!data.success) {
      const code = data.error?.code;
      if (code === 403 || code === 406) throw new TwoFactorRequiredError();
      if (code === 404) throw new Error("OTP Code ungültig");
      throw new Error(`Synology Auth fehlgeschlagen: Code ${code || "unbekannt"}`);
    }

    cachedSession = {
      sid: data.data.sid,
      expiresAt: Date.now() + 6 * 24 * 60 * 60 * 1000,
    };

    const newDeviceId = data.data.device_id || data.data.did;
    if (newDeviceId && newDeviceId !== cfg.deviceId) {
      this.saveDeviceId(newDeviceId);
    }

    return cachedSession.sid;
  }

  async loginWithOtp(otpCode: string): Promise<{ success: boolean; error?: string }> {
    const cfg = getSynologyConfig();
    if (!cfg) return { success: false, error: "Synology nicht konfiguriert" };

    const params = new URLSearchParams({
      api: "SYNO.API.Auth",
      version: "6",
      method: "login",
      account: cfg.username,
      passwd: cfg.password,
      otp_code: otpCode,
      enable_device_token: "yes",
      device_name: "Servr Dash",
      format: "sid",
    });

    try {
      const res = await fetch(`${cfg.url}/webapi/auth.cgi?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };

      const data = await res.json();
      if (!data.success) {
        const code = data.error?.code;
        if (code === 404) return { success: false, error: "OTP Code ungültig" };
        return { success: false, error: `Fehler Code ${code}` };
      }

      cachedSession = {
        sid: data.data.sid,
        expiresAt: Date.now() + 6 * 24 * 60 * 60 * 1000,
      };

      const deviceId = data.data.device_id || data.data.did;
      if (deviceId) this.saveDeviceId(deviceId);

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Fehler" };
    }
  }

  private saveDeviceId(deviceId: string) {
    const config = getConfig();
    if (config.synology) {
      (config.synology as SynologyConfig).deviceId = deviceId;
      saveConfig(config);
    }
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
      api, version, method, _sid: sid, ...extraParams,
    });

    const res = await fetch(`${cfg.url}/webapi/entry.cgi?${params}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Synology API HTTP ${res.status}`);

    const data = await res.json();

    if (!data.success) {
      if (data.error?.code === 119 || data.error?.code === 105) {
        cachedSession = null;
        const newSid = await this.getSession();
        const retryParams = new URLSearchParams({
          api, version, method, _sid: newSid, ...extraParams,
        });
        const retryRes = await fetch(`${cfg.url}/webapi/entry.cgi?${retryParams}`, { cache: "no-store" });
        const retryData = await retryRes.json();
        if (!retryData.success) throw new Error(`Synology API: ${api} Code ${retryData.error?.code}`);
        return retryData.data as T;
      }
      throw new Error(`Synology API: ${api} Code ${data.error?.code}`);
    }

    return data.data as T;
  }

  // --- Public API ---

  async testConnection(): Promise<{ success: boolean; needs2fa?: boolean }> {
    try {
      const cfg = getSynologyConfig();
      if (!cfg) return { success: false };
      await this.getSession();
      return { success: true };
    } catch (err) {
      if (err instanceof TwoFactorRequiredError) return { success: false, needs2fa: true };
      return { success: false };
    }
  }

  async getDevices(): Promise<ABBDevice[]> {
    try {
      const data = await this.apiCall<{
        devices: ABBDeviceRaw[];
        total: number;
      }>("SYNO.ActiveBackup.Device", "list", { limit: "100", offset: "0" });

      const rawDevices = data.devices || [];

      // Get recent logs to determine last backup per device
      let logs: ABBLogRaw[] = [];
      try {
        const logData = await this.apiCall<{ results: ABBLogRaw[] }>(
          "SYNO.ActiveBackup.Log", "list_result", { limit: "200", offset: "0" }
        );
        logs = logData.results || [];
      } catch { /* ignore */ }

      const now = Date.now() / 1000;

      return rawDevices.map((d) => {
        // Find last log for this device
        const deviceLogs = logs.filter((l) =>
          l.task_config?.device_list?.some(
            (dl) => dl.device_id === d.device_id || dl.host_name === d.host_name
          )
        );
        const lastLog = deviceLogs[0]; // Already sorted by time desc

        // Consider online if login_time is within last 24h or has agent_token
        const isOnline = !!d.agent_token && (now - d.login_time) < 86400;

        return {
          device_id: d.device_id,
          device_name: d.host_name,
          host_name: d.host_name,
          ip_addr: d.host_ip || "–",
          os_name: d.os_name || "–",
          backup_type: d.backup_type,
          backup_type_label: getBackupTypeLabel(d.backup_type),
          login_time: d.login_time,
          login_user: d.login_user || "–",
          task_count: d.task_count,
          is_online: isOnline,
          last_backup_time: lastLog?.time_end,
          last_backup_status: lastLog?.status,
        };
      });
    } catch (err) {
      console.error("ABB getDevices:", err);
      return [];
    }
  }

  async getTasks(): Promise<ABBTask[]> {
    try {
      const data = await this.apiCall<{
        tasks: ABBTaskRaw[];
        total: number;
      }>("SYNO.ActiveBackup.Task", "list", { limit: "100", offset: "0" });

      const rawTasks = data.tasks || [];

      // Get recent logs for last backup info
      let logs: ABBLogRaw[] = [];
      try {
        const logData = await this.apiCall<{ results: ABBLogRaw[] }>(
          "SYNO.ActiveBackup.Log", "list_result", { limit: "200", offset: "0" }
        );
        logs = logData.results || [];
      } catch { /* ignore */ }

      return rawTasks.map((t) => {
        const taskLogs = logs.filter((l) => l.task_id === t.task_id);
        const lastLog = taskLogs[0];

        return {
          task_id: t.task_id,
          task_name: t.task_name,
          backup_type: t.backup_type,
          backup_type_label: getBackupTypeLabel(t.backup_type),
          device_count: t.device_count,
          device_names: (t.devices || []).map((d) => d.host_name),
          next_trigger_time: t.next_trigger_time,
          schedule_label: getScheduleLabel(t.sched_content),
          retention_versions: t.retention_policy?.keep_versions || "–",
          is_scheduled: t.next_trigger_time > 0,
          last_backup_time: lastLog?.time_end,
          last_backup_status: lastLog?.status,
        };
      });
    } catch (err) {
      console.error("ABB getTasks:", err);
      return [];
    }
  }

  async getLogs(limit = 50): Promise<ABBLogEntry[]> {
    try {
      const data = await this.apiCall<{
        results: ABBLogRaw[];
        count: number;
      }>("SYNO.ActiveBackup.Log", "list_result", {
        limit: String(limit),
        offset: "0",
      });

      return (data.results || []).map((l) => {
        const deviceNames = (l.task_config?.device_list || [])
          .map((d) => d.host_name)
          .join(", ");

        return {
          result_id: l.result_id,
          task_id: l.task_id,
          task_name: l.task_name,
          device_name: deviceNames || "–",
          backup_type: l.backup_type,
          backup_type_label: getBackupTypeLabel(l.backup_type),
          status: l.status,
          status_label: getLogStatusLabel(l.status),
          time_start: l.time_start,
          time_end: l.time_end,
          duration_seconds: l.time_end - l.time_start,
          success_count: l.success_count,
          warning_count: l.warning_count,
          error_count: l.error_count,
        };
      });
    } catch (err) {
      console.error("ABB getLogs:", err);
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
    const recentLogs = logs.filter((l) => l.time_end > last24h);

    return {
      total_devices: devices.length,
      online_devices: devices.filter((d) => d.is_online).length,
      offline_devices: devices.filter((d) => !d.is_online).length,
      total_tasks: tasks.length,
      scheduled_tasks: tasks.filter((t) => t.is_scheduled).length,
      last_24h_backups: recentLogs.length,
      success_count: recentLogs.filter((l) => l.status === 2).length,
      warning_count: recentLogs.filter((l) => l.status === 3).length,
      error_count: recentLogs.filter((l) => l.status === 4).length,
      activated: true,
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
