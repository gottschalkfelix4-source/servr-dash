"use client";

import Link from "next/link";
import { ArrowRightLeft, HardDrive, Waypoints } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatBytes } from "@/lib/utils";
import type { RcloneOverview } from "@/types/rclone";

export function RcloneSummaryCard({ overview }: { overview: RcloneOverview }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Waypoints size={16} className="text-accent-cyan mr-2 inline" />
          Rclone
        </CardTitle>
        <Link
          href="/rclone"
          className="text-xs text-muted hover:text-accent-cyan transition-colors"
        >
          Details →
        </Link>
      </CardHeader>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="text-xs text-muted mb-1">Profile online</div>
          <div className="text-xl font-bold">{overview.onlineProfiles}/{overview.profileCount}</div>
        </div>
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center gap-1 text-xs text-muted mb-1">
            <HardDrive size={12} />
            Mounts
          </div>
          <div className="text-xl font-bold">{overview.mountsHealthy}/{overview.mountsTotal}</div>
        </div>
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center gap-1 text-xs text-muted mb-1">
            <ArrowRightLeft size={12} />
            Aktive Jobs
          </div>
          <div className="text-xl font-bold">{overview.activeTransfers}</div>
        </div>
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="text-xs text-muted mb-1">Durchsatz</div>
          <div className="text-xl font-bold">{formatBytes(overview.totalSpeed)}/s</div>
          {overview.lastErrors[0] ? (
            <Badge variant="warning" className="mt-2 max-w-full truncate">
              {overview.lastErrors[0]}
            </Badge>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
