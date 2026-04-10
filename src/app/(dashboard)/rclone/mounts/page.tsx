"use client";

import { useState } from "react";
import { HardDrive, RefreshCw, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RcloneMountTable } from "@/components/rclone/RcloneMountTable";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useRcloneMounts } from "@/hooks/useRclone";

export default function RcloneMountsPage() {
  const { data, mutate } = useRcloneMounts();
  const [busyProfileId, setBusyProfileId] = useState<string | null>(null);
  const mounts = data?.mounts || [];
  const healthy = mounts.filter((mount) => mount.status === "online").length;
  const degraded = mounts.filter((mount) => mount.status !== "online").length;

  async function handleRecheck(profileId?: string) {
    setBusyProfileId(profileId || "all");
    try {
      await fetch("/api/rclone/recheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileId ? { profileId } : {}),
      });
      await mutate();
    } finally {
      setBusyProfileId(null);
    }
  }

  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rclone Mounts"
        description="Zusammengefuehrte Mount-Sicht aus manuellen Eintraegen sowie RC- und SSH-Discovery"
        actions={
          <button
            onClick={() => handleRecheck()}
            disabled={busyProfileId === "all"}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw size={14} className={busyProfileId === "all" ? "animate-spin" : ""} />
            Alle pruefen
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="mb-2 flex items-center gap-2">
            <HardDrive size={16} className="text-accent-cyan" />
            <span className="text-xs text-muted">Gesamt</span>
          </div>
          <div className="text-2xl font-bold">{mounts.length}</div>
        </Card>
        <Card>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="success">Online</Badge>
          </div>
          <div className="text-2xl font-bold">{healthy}</div>
        </Card>
        <Card>
          <div className="mb-2 flex items-center gap-2">
            <TriangleAlert size={16} className="text-accent-amber" />
            <span className="text-xs text-muted">Degradiert</span>
          </div>
          <div className="text-2xl font-bold">{degraded}</div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mount Status</CardTitle>
          <Badge variant="default">{mounts.length}</Badge>
        </CardHeader>
        {mounts.length > 0 ? (
          <RcloneMountTable
            mounts={mounts}
            onRecheck={handleRecheck}
            busyProfileId={busyProfileId}
          />
        ) : (
          <div className="py-8 text-sm text-muted">
            Fuer die aktuellen Profile wurden noch keine Mount-Pfade gefunden.
          </div>
        )}
      </Card>
    </div>
  );
}
