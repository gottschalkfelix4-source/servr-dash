export interface SynologyConfig {
  url: string;
  username: string;
  password: string;
}

export interface SynologySession {
  sid: string;
  expiresAt: number;
}

export interface ABBDevice {
  device_id: number;
  device_name: string;
  host_name: string;
  ip_addr: string;
  os_name?: string;
  os_version?: string;
  status: number; // 0=offline, 1=online, 2=backing up, etc.
  last_backup_time?: number; // unix timestamp
  next_backup_time?: number;
  backup_status?: number; // last backup result
  device_type?: number;
  agent_version?: string;
  total_backup_size?: number;
}

export interface ABBTask {
  task_id: number;
  task_name: string;
  device_id?: number;
  device_name?: string;
  status: number;
  schedule_type?: string;
  backup_type?: number;
  last_backup_time?: number;
  next_backup_time?: number;
  last_backup_status?: number;
  retention_policy?: string;
}

export interface ABBLogEntry {
  log_id: number;
  task_id?: number;
  device_id?: number;
  device_name?: string;
  task_name?: string;
  status: number; // 1=success, 2=warning, 3=error, 4=cancelled
  time_start: number;
  time_end: number;
  transferred_bytes?: number;
  backup_type?: number;
  result_detail?: string;
}

export interface ABBOverview {
  total_devices: number;
  online_devices: number;
  offline_devices: number;
  total_tasks: number;
  active_tasks: number;
  success_count: number;
  warning_count: number;
  error_count: number;
  last_24h_backups: number;
  total_backup_size: number;
}

// Status helper constants
export const DEVICE_STATUS = {
  0: "Offline",
  1: "Online",
  2: "Backup läuft",
  3: "Fehler",
  4: "Verbindung getrennt",
} as const;

export const BACKUP_STATUS = {
  1: "Erfolgreich",
  2: "Warnung",
  3: "Fehlgeschlagen",
  4: "Abgebrochen",
  5: "Läuft",
} as const;
