export interface CloudflareConfig {
  apiToken: string;
}

export interface CFZone {
  id: string;
  name: string;
  status: string; // active, pending, initializing, moved
  type: string;
  name_servers: string[];
  created_on: string;
  modified_on: string;
  activated_on: string;
  plan?: { name: string };
}

export interface CFDnsRecord {
  id: string;
  zone_id: string;
  zone_name: string;
  type: string; // A, AAAA, CNAME, MX, TXT, NS, SRV, etc.
  name: string;
  content: string;
  ttl: number; // 1 = auto
  proxied: boolean;
  proxiable: boolean;
  comment?: string;
  tags?: string[];
  priority?: number; // MX, SRV
  created_on: string;
  modified_on: string;
}

export interface CFCreateRecord {
  type: string;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  comment?: string;
  priority?: number;
}

export interface CFUpdateRecord {
  type?: string;
  name?: string;
  content?: string;
  ttl?: number;
  proxied?: boolean;
  comment?: string;
  priority?: number;
}

export const DNS_RECORD_TYPES = [
  "A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA", "PTR",
] as const;

export const ZONE_STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  pending: "Ausstehend",
  initializing: "Initialisierung",
  moved: "Verschoben",
};
