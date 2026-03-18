import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Monitor } from "lucide-react";
import type { OsInfo } from "@/types/server";

interface OsInfoCardProps {
  os: OsInfo;
  uptime: number;
}

export function OsInfoCard({ os, uptime }: OsInfoCardProps) {
  const uptimeDays = Math.floor(uptime / 86400);
  const uptimeHours = Math.floor((uptime % 86400) / 3600);
  const uptimeMinutes = Math.floor((uptime % 3600) / 60);

  const items = [
    { label: "Betriebssystem", value: os.name },
    { label: "Kernel", value: os.kernel },
    { label: "Architektur", value: os.arch },
    { label: "Hostname", value: os.hostname },
    {
      label: "Uptime",
      value: `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Info</CardTitle>
        <Monitor size={16} className="text-muted" />
      </CardHeader>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-muted">{item.label}</span>
            <span className="font-mono text-xs">{item.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
