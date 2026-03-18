import useSWR, { mutate } from "swr";
import type { CFZone, CFDnsRecord, CFCreateRecord, CFUpdateRecord } from "@/types/cloudflare";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `${res.status}`);
  }
  return res.json();
};

const defaultOpts = { revalidateOnFocus: false, dedupingInterval: 5000 };

export function useCloudflareZones() {
  return useSWR<CFZone[]>("/api/cloudflare/zones", fetcher, {
    ...defaultOpts,
    refreshInterval: 60000,
  });
}

export function useCloudflareRecords(zoneId: string | null, type?: string) {
  const params = new URLSearchParams();
  if (zoneId) params.set("zoneId", zoneId);
  if (type) params.set("type", type);

  return useSWR<CFDnsRecord[]>(
    zoneId ? `/api/cloudflare/records?${params}` : null,
    fetcher,
    { ...defaultOpts, refreshInterval: 30000 }
  );
}

export async function createDnsRecord(zoneId: string, record: CFCreateRecord) {
  const res = await fetch("/api/cloudflare/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ zoneId, ...record }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Erstellen fehlgeschlagen");
  }
  mutate(`/api/cloudflare/records?zoneId=${zoneId}`);
  return res.json();
}

export async function updateDnsRecord(
  zoneId: string,
  recordId: string,
  record: CFUpdateRecord
) {
  const res = await fetch("/api/cloudflare/records", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ zoneId, recordId, ...record }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Update fehlgeschlagen");
  }
  mutate(`/api/cloudflare/records?zoneId=${zoneId}`);
  return res.json();
}

export async function deleteDnsRecord(zoneId: string, recordId: string) {
  const res = await fetch(
    `/api/cloudflare/records?zoneId=${zoneId}&recordId=${recordId}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Löschen fehlgeschlagen");
  }
  mutate(`/api/cloudflare/records?zoneId=${zoneId}`);
}
