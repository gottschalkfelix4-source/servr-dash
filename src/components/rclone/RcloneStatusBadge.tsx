"use client";

import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import type { RcloneHealthStatus } from "@/types/rclone";

const labelMap: Record<RcloneHealthStatus, string> = {
  online: "Online",
  warning: "Warnung",
  offline: "Offline",
  unknown: "Unbekannt",
};

const variantMap: Record<RcloneHealthStatus, "success" | "warning" | "danger" | "default"> = {
  online: "success",
  warning: "warning",
  offline: "danger",
  unknown: "default",
};

export function RcloneStatusBadge({ status }: { status: RcloneHealthStatus }) {
  return (
    <Badge variant={variantMap[status]}>
      <StatusDot status={status === "warning" ? "warning" : status} className="mr-1.5" />
      {labelMap[status]}
    </Badge>
  );
}
