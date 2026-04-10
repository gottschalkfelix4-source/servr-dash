"use client";

import { RefreshCw } from "lucide-react";
import { RcloneStatusBadge } from "@/components/rclone/RcloneStatusBadge";
import { Badge } from "@/components/ui/Badge";
import type { RcloneMountStatus } from "@/types/rclone";

export function RcloneMountTable({
  mounts,
  onRecheck,
  busyProfileId,
}: {
  mounts: RcloneMountStatus[];
  onRecheck?: (profileId: string) => void;
  busyProfileId?: string | null;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-2.5">Status</th>
            <th className="px-3 py-2.5">Mount</th>
            <th className="px-3 py-2.5">Pfad</th>
            <th className="px-3 py-2.5">Remote</th>
            <th className="px-3 py-2.5">Quelle</th>
            <th className="px-3 py-2.5">Host</th>
            <th className="px-3 py-2.5">Zuletzt geprueft</th>
            <th className="px-3 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {mounts.map((mount) => (
            <tr
              key={`${mount.profileId}-${mount.mountId}`}
              className="border-b border-white/[0.04]"
            >
              <td className="px-3 py-3 align-top">
                <RcloneStatusBadge status={mount.status} />
              </td>
              <td className="px-3 py-3 align-top">
                <div className="font-medium">{mount.label}</div>
                {mount.error && (
                  <div className="mt-1 text-xs text-accent-amber">{mount.error}</div>
                )}
              </td>
              <td className="px-3 py-3 align-top font-mono text-xs text-muted">
                {mount.path}
              </td>
              <td className="px-3 py-3 align-top">{mount.remoteName || "-"}</td>
              <td className="px-3 py-3 align-top">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={mount.source === "manual" ? "default" : "info"}>
                    {mount.source === "manual" ? "Manuell" : "Gefunden"}
                  </Badge>
                  {mount.source === "discovered" && mount.discoveredBy && (
                    <Badge variant="default">{mount.discoveredBy.toUpperCase()}</Badge>
                  )}
                </div>
              </td>
              <td className="px-3 py-3 align-top">{mount.serverName || "-"}</td>
              <td className="px-3 py-3 align-top text-xs text-muted">
                {new Date(mount.lastChecked).toLocaleString("de-DE")}
              </td>
              <td className="px-3 py-3 align-top">
                {onRecheck && (
                  <button
                    onClick={() => onRecheck(mount.profileId)}
                    disabled={busyProfileId === mount.profileId}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground disabled:opacity-50"
                  >
                    <RefreshCw
                      size={12}
                      className={busyProfileId === mount.profileId ? "animate-spin" : ""}
                    />
                    Recheck
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
