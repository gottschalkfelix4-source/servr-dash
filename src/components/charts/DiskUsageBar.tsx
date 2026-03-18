"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatBytes } from "@/lib/utils";
import type { DiskMetrics } from "@/types/server";

interface DiskUsageBarProps {
  disks: DiskMetrics[];
}

export function DiskUsageBar({ disks }: DiskUsageBarProps) {
  return (
    <div className="space-y-3">
      {disks.map((disk) => (
        <div key={disk.mount}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted font-mono">{disk.mount}</span>
            <span className="text-muted">
              {formatBytes(disk.used)} / {formatBytes(disk.total)}
            </span>
          </div>
          <ProgressBar value={disk.used} max={disk.total} showLabel />
        </div>
      ))}
    </div>
  );
}
