"use client";

import { CircleStop, Clock3 } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { formatBytes, formatUptime } from "@/lib/utils";
import type { RcloneTransferJob } from "@/types/rclone";

function transferVariant(status: RcloneTransferJob["status"]) {
  switch (status) {
    case "success":
      return "success";
    case "error":
      return "danger";
    case "running":
      return "info";
    default:
      return "warning";
  }
}

export function RcloneTransfersPanel({
  transfers,
  onStop,
  stoppingTransferId,
}: {
  transfers: RcloneTransferJob[];
  onStop?: (transfer: RcloneTransferJob) => void;
  stoppingTransferId?: string | null;
}) {
  return (
    <div className="space-y-3">
      {transfers.map((transfer) => (
        <div
          key={`${transfer.profileId}-${transfer.id}-${transfer.finishedAt ?? transfer.startedAt}`}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={transferVariant(transfer.status)}>
                  {transfer.status === "running"
                    ? "Läuft"
                    : transfer.status === "success"
                    ? "Fertig"
                    : transfer.status === "error"
                    ? "Fehler"
                    : "Gestoppt"}
                </Badge>
                <span className="text-xs text-muted">{transfer.profileId}</span>
              </div>
              <div className="font-medium truncate">{transfer.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                <span>{formatBytes(transfer.bytes)} / {formatBytes(transfer.size || transfer.bytes)}</span>
                <span>{formatBytes(transfer.speed)}/s</span>
                {transfer.etaSeconds ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={12} />
                    ETA {formatUptime(transfer.etaSeconds)}
                  </span>
                ) : null}
                {transfer.direction ? <span>{transfer.direction}</span> : null}
              </div>
              {transfer.error && (
                <div className="mt-2 text-xs text-accent-red">{transfer.error}</div>
              )}
            </div>
            {onStop && transfer.stoppable && transfer.status === "running" && (
              <button
                onClick={() => onStop(transfer)}
                disabled={stoppingTransferId === transfer.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent-red/20 px-3 py-2 text-xs text-accent-red transition-colors hover:bg-accent-red/10 disabled:opacity-50"
              >
                <CircleStop size={13} />
                {stoppingTransferId === transfer.id ? "Stoppe..." : "Stoppen"}
              </button>
            )}
          </div>
          <div className="mt-3">
            <ProgressBar value={Math.max(0, Math.min(100, transfer.progress || 0))} />
          </div>
        </div>
      ))}
    </div>
  );
}
