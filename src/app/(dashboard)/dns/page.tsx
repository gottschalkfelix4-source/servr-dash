"use client";

import Link from "next/link";
import { Globe, ExternalLink, Shield } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCloudflareZones } from "@/hooks/useCloudflare";
import { ZONE_STATUS_LABELS } from "@/types/cloudflare";

export default function DnsPage() {
  const { data: zones, isLoading, error } = useCloudflareZones();

  return (
    <div>
      <PageHeader
        title="DNS Management"
        description="Cloudflare Domains & DNS Records"
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : error || !zones ? (
        <Card>
          <div className="text-center py-12">
            <Globe size={48} className="mx-auto text-muted mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Cloudflare nicht konfiguriert
            </h3>
            <p className="text-sm text-muted mb-4">
              Konfiguriere den Cloudflare API Token in den Einstellungen.
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-cyan/10 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
            >
              Zu den Einstellungen
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <Link
              key={zone.id}
              href={`/dns/${zone.id}`}
              className="group"
            >
              <Card className="hover:border-accent-cyan/20 hover:shadow-[0_0_25px_-8px_rgba(34,211,238,0.15)] transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center shrink-0 group-hover:shadow-[0_0_15px_-3px_rgba(34,211,238,0.4)] transition-shadow">
                    <Globe size={18} className="text-accent-cyan" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold truncate group-hover:text-accent-cyan transition-colors">
                        {zone.name}
                      </h3>
                      <ExternalLink
                        size={12}
                        className="text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusDot
                        status={zone.status === "active" ? "online" : "unknown"}
                      />
                      <Badge
                        variant={zone.status === "active" ? "success" : "default"}
                      >
                        {ZONE_STATUS_LABELS[zone.status] || zone.status}
                      </Badge>
                      {zone.plan?.name && (
                        <span className="text-[10px] text-muted">
                          {zone.plan.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/[0.04] text-xs text-muted">
                  <div className="flex justify-between">
                    <span>Nameservers</span>
                    <span className="text-foreground truncate ml-4 max-w-[200px]">
                      {zone.name_servers?.slice(0, 2).join(", ")}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}

          {zones.length === 0 && (
            <Card className="md:col-span-2 xl:col-span-3">
              <div className="text-center py-8 text-sm text-muted">
                Keine Domains gefunden. Prüfe die API Token Berechtigungen.
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
