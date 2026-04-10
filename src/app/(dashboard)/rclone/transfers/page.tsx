"use client";

import { useState } from "react";
import { ArrowRightLeft, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { RcloneTransfersPanel } from "@/components/rclone/RcloneTransfersPanel";
import { useRcloneTransfers } from "@/hooks/useRclone";
import type { RcloneTransferJob } from "@/types/rclone";

export default function RcloneTransfersPage() {
  const { data, mutate } = useRcloneTransfers();
  const [stoppingTransferId, setStoppingTransferId] = useState<string | null>(null);
  const active = data?.active || [];
  const recent = data?.recent || [];

  async function handleRefresh() {
    await fetch("/api/rclone/recheck", { method: "POST" });
    await mutate();
  }

  async function handleStop(transfer: RcloneTransferJob) {
    setStoppingTransferId(transfer.id);
    try {
      await fetch(`/api/rclone/transfers/${transfer.id}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: transfer.profileId }),
      });
      await mutate();
    } finally {
      setStoppingTransferId(null);
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
        title="Rclone Transfers"
        description="Laufende Jobs und kürzlich beendete Transfers"
        actions={
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground"
          >
            <RefreshCw size={14} />
            Aktualisieren
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft size={16} className="text-accent-cyan" />
            <span className="text-xs text-muted">Laufende Jobs</span>
          </div>
          <div className="text-2xl font-bold">{active.length}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default">Zuletzt beendet</Badge>
          </div>
          <div className="text-2xl font-bold">{recent.length}</div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aktive Transfers</CardTitle>
          <Badge variant="info">{active.length}</Badge>
        </CardHeader>
        {active.length > 0 ? (
          <RcloneTransfersPanel
            transfers={active}
            onStop={handleStop}
            stoppingTransferId={stoppingTransferId}
          />
        ) : (
          <div className="py-8 text-sm text-muted">Aktuell laufen keine Rclone-Jobs.</div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kürzlich beendet</CardTitle>
          <Badge variant="default">{recent.length}</Badge>
        </CardHeader>
        {recent.length > 0 ? (
          <RcloneTransfersPanel transfers={recent} />
        ) : (
          <div className="py-8 text-sm text-muted">Noch keine kürzlich beendeten Transfers verfügbar.</div>
        )}
      </Card>
    </div>
  );
}
