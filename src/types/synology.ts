export interface SynologyConfig {
  url: string;
  username: string;
  password: string;
  deviceId?: string; // 2FA device token — saved after first OTP login
}

export interface SynologySession {
  sid: string;
  expiresAt: number;
}

// Raw API response types (actual Synology API structure)
export interface ABBDeviceRaw {
  device_id: number;
  device_uuid: string;
  host_name: string;
  host_ip: string;
  os_name: string;
  backup_type: number; // 1=VM, 2=PC, 3=Server
  create_time: number;
  login_time: number;
  login_user: string;
  kernel_version: string;
  task_count: number;
  agent_token: string;
}

export interface ABBTaskRaw {
  task_id: number;
  task_name: string;
  backup_type: number; // 1=VM, 2=PC, 3=Server
  device_count: number;
  next_trigger_time: number; // -1 = manual/once
  devices: {
    device_id: number;
    host_name: string;
    os_name: string;
    host_ip: string;
  }[];
  sched_content: {
    repeat_type: string; // "Weekly", "Daily", "Once"
    run_hour: number;
    run_min: number;
    run_weekday: number[];
    schedule_setting_type: number;
  };
  retention_policy: {
    keep_all: boolean;
    keep_versions: string;
  };
  share_name: string;
  target_dir: string;
  enable_dedup: boolean;
  enable_compress_transfer: boolean;
  enable_encrypt_transfer: boolean;
}

export interface ABBLogRaw {
  result_id: number;
  task_id: number;
  task_name: string;
  backup_type: number;
  status: number; // 2=success, 3=warning, 4=error, 5=cancelled, 6=running
  time_start: number;
  time_end: number;
  success_count: number;
  warning_count: number;
  error_count: number;
  job_action: number;
  task_config: {
    device_list: { device_id?: number; host_name: string }[];
  };
}

// Processed types for UI
export interface ABBDevice {
  device_id: number;
  device_name: string;
  host_name: string;
  ip_addr: string;
  os_name: string;
  backup_type: number;
  backup_type_label: string;
  login_time: number;
  login_user: string;
  task_count: number;
  is_online: boolean;
  last_backup_time?: number;
  last_backup_status?: number;
}

export interface ABBTask {
  task_id: number;
  task_name: string;
  backup_type: number;
  backup_type_label: string;
  device_count: number;
  device_names: string[];
  next_trigger_time: number;
  schedule_label: string;
  retention_versions: string;
  is_scheduled: boolean;
  last_backup_time?: number;
  last_backup_status?: number;
}

export interface ABBLogEntry {
  result_id: number;
  task_id: number;
  task_name: string;
  device_name: string;
  backup_type: number;
  backup_type_label: string;
  status: number;
  status_label: string;
  time_start: number;
  time_end: number;
  duration_seconds: number;
  success_count: number;
  warning_count: number;
  error_count: number;
}

export interface ABBOverview {
  total_devices: number;
  online_devices: number;
  offline_devices: number;
  total_tasks: number;
  scheduled_tasks: number;
  last_24h_backups: number;
  success_count: number;
  warning_count: number;
  error_count: number;
  activated: boolean;
}

// Helper functions
export function getBackupTypeLabel(type: number): string {
  switch (type) {
    case 1: return "VM";
    case 2: return "PC";
    case 3: return "Server";
    default: return "Unbekannt";
  }
}

export function getLogStatusLabel(status: number): string {
  switch (status) {
    case 2: return "Erfolgreich";
    case 3: return "Warnung";
    case 4: return "Fehlgeschlagen";
    case 5: return "Abgebrochen";
    case 6: return "Läuft";
    default: return "Unbekannt";
  }
}

export function getScheduleLabel(sched: ABBTaskRaw["sched_content"]): string {
  if (!sched) return "Manuell";
  if (sched.repeat_type === "Once") return "Einmalig";
  if (sched.repeat_type === "Daily") return `Täglich ${sched.run_hour}:${String(sched.run_min).padStart(2, "0")}`;
  if (sched.repeat_type === "Weekly") {
    const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    const dayStr = (sched.run_weekday || []).map((d) => days[d] || "?").join(", ");
    return `${dayStr} ${sched.run_hour}:${String(sched.run_min).padStart(2, "0")}`;
  }
  return sched.repeat_type;
}
