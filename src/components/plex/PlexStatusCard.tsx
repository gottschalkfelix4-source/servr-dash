import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusDot } from "@/components/ui/StatusDot";
import { Badge } from "@/components/ui/Badge";
import { Tv } from "lucide-react";
import type { PlexServerStatus } from "@/types/plex";

interface PlexStatusCardProps {
  status: PlexServerStatus;
}

export function PlexStatusCard({ status }: PlexStatusCardProps) {
  return (
    <Card glow={status.online ? "purple" : undefined}>
      <CardHeader>
        <CardTitle>Plex Server</CardTitle>
        <Tv size={16} className="text-accent-purple" />
      </CardHeader>
      <div className="flex items-center gap-3 mb-3">
        <StatusDot status={status.online ? "online" : "offline"} />
        <span className="font-medium">{status.name}</span>
      </div>
      <div className="flex items-center gap-2">
        {status.version && (
          <Badge variant="info">v{status.version}</Badge>
        )}
        {status.platform && (
          <Badge variant="default">{status.platform}</Badge>
        )}
      </div>
    </Card>
  );
}
