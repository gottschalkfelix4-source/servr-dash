"use client";

import { RefreshCw, Server, ArrowRightLeft, TriangleAlert } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RcloneStatusBadge } from "@/components/rclone/RcloneStatusBadge";
import { formatBytes } from "@/lib/utils";
import type { RcloneProfileStatus } from "@/types/rclone";

export function RcloneProfileCard({
  profile,
  onRecheck,
  busy = false,
}: {
  profile: RcloneProfileStatus;
  onRecheck?: (profileId: string) => void;
  busy?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-foreground">{profile.name}</CardTitle>
          <p className="text-xs text-muted mt-1">{profile.serverName}</p>
        </div>
        <div className="flex items-center gap-2">
          <RcloneStatusBadge status={profile.status} />
          {onRecheck && (
            <button
              onClick={() => onRecheck(profile.id)}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw size={12} className={busy ? "animate-spin" : ""} />
              Prüfen
            </button>
          )}
        </div>
      </CardHeader>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
          <div className="flex items-center gap-2 text-xs text-muted mb-1">
            <Server size={12} />
            RC / Version
          </div>
          <div className="text-sm font-medium">
            {profile.rcOnline ? profile.version || "Verbunden" : "Nicht erreichbar"}
          </div>
        </div>
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
          <div className="flex items-center gap-2 text-xs text-muted mb-1">
            <ArrowRightLeft size={12} />
            Durchsatz
          </div>
          <div className="text-sm font-medium">{formatBytes(profile.stats.speed)}/s</div>
        </div>
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
          <div className="text-xs text-muted mb-1">Mounts</div>
          <div className="text-sm font-medium">
            {profile.mountsOnline}/{profile.mountsTotal}
          </div>
        </div>
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
          <div className="text-xs text-muted mb-1">Aktive Jobs</div>
          <div className="text-sm font-medium">{profile.activeTransfers}</div>
        </div>
      </div>

      {profile.lastError && (
        <div className="mt-3 rounded-lg border border-accent-amber/20 bg-accent-amber/8 p-3 text-xs text-accent-amber">
          <div className="flex items-center gap-2 font-medium mb-1">
            <TriangleAlert size={12} />
            Letzter Hinweis
          </div>
          {profile.lastError}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        <Badge variant="info">{profile.stats.totalTransfers} Transfers gesamt</Badge>
        <Badge variant={profile.stats.errors > 0 ? "warning" : "default"}>
          {profile.stats.errors} Fehler
        </Badge>
      </div>
    </Card>
  );
}
