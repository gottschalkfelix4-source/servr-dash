import { getConfig } from "@/lib/config";
import type {
  CloudflareConfig,
  CFZone,
  CFDnsRecord,
  CFCreateRecord,
  CFUpdateRecord,
} from "@/types/cloudflare";

const CF_BASE = "https://api.cloudflare.com/client/v4";

function getCloudflareConfig(): CloudflareConfig | null {
  const config = getConfig();
  const cf = config.cloudflare as CloudflareConfig | undefined;
  if (!cf?.apiToken) return null;
  return cf;
}

class CloudflareClient {
  private async request<T>(
    path: string,
    init?: RequestInit
  ): Promise<T> {
    const cfg = getCloudflareConfig();
    if (!cfg) throw new Error("Cloudflare nicht konfiguriert");

    const res = await fetch(`${CF_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${cfg.apiToken}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!data.success) {
      const errors = data.errors?.map((e: { message: string }) => e.message).join(", ");
      throw new Error(errors || `Cloudflare API Fehler: ${res.status}`);
    }

    return data.result as T;
  }

  // --- Zones ---

  async getZones(): Promise<CFZone[]> {
    return this.request<CFZone[]>("/zones?per_page=50&order=name&direction=asc");
  }

  async getZone(zoneId: string): Promise<CFZone> {
    return this.request<CFZone>(`/zones/${zoneId}`);
  }

  // --- DNS Records ---

  async getRecords(zoneId: string, type?: string): Promise<CFDnsRecord[]> {
    let path = `/zones/${zoneId}/dns_records?per_page=500&order=name&direction=asc`;
    if (type) path += `&type=${type}`;
    return this.request<CFDnsRecord[]>(path);
  }

  async getRecord(zoneId: string, recordId: string): Promise<CFDnsRecord> {
    return this.request<CFDnsRecord>(
      `/zones/${zoneId}/dns_records/${recordId}`
    );
  }

  async createRecord(
    zoneId: string,
    record: CFCreateRecord
  ): Promise<CFDnsRecord> {
    return this.request<CFDnsRecord>(`/zones/${zoneId}/dns_records`, {
      method: "POST",
      body: JSON.stringify(record),
    });
  }

  async updateRecord(
    zoneId: string,
    recordId: string,
    record: CFUpdateRecord
  ): Promise<CFDnsRecord> {
    return this.request<CFDnsRecord>(
      `/zones/${zoneId}/dns_records/${recordId}`,
      {
        method: "PUT",
        body: JSON.stringify(record),
      }
    );
  }

  async deleteRecord(zoneId: string, recordId: string): Promise<void> {
    await this.request(`/zones/${zoneId}/dns_records/${recordId}`, {
      method: "DELETE",
    });
  }

  // --- Verify ---

  async verifyToken(): Promise<boolean> {
    try {
      const cfg = getCloudflareConfig();
      if (!cfg) return false;
      const res = await fetch(`${CF_BASE}/user/tokens/verify`, {
        headers: { Authorization: `Bearer ${cfg.apiToken}` },
        cache: "no-store",
      });
      const data = await res.json();
      return data.success === true;
    } catch {
      return false;
    }
  }

  isConfigured(): boolean {
    return !!getCloudflareConfig();
  }
}

export const cloudflareClient = new CloudflareClient();
