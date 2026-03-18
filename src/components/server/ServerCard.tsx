"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusDot } from "@/components/ui/StatusDot";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Server } from "lucide-react";
import { formatUptime } from "@/lib/utils";
import useSWR from "swr";
import type { ServerMetrics } from "@/types/server";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

interface ServerCardProps {
  id: string;
  name: string;
  host: string;
}

export function ServerCard({ id, name, host }: ServerCardProps) {
  const { data, error } = useSWR<{ metrics: ServerMetrics }>(
    `/api/servers/${id}/metrics`,
    fetcher,
    { refreshInterval: 5000, revalidateOnFocus: false }
  );

  const metrics = data?.metrics;
  const isOnline = !!metrics;
  const hasError = !!error;

  return (
    <Link href={`/servers/${id}`}>
      <Card hover className="h-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(34,211,238,0.3)]">
            <Server size={20} className="text-accent-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <StatusDot
                status={hasError ? "offline" : isOnline ? "online" : "unknown"}
              />
              <span className="font-medium text-sm truncate">{name}</span>
            </div>
            <span className="text-xs text-muted font-mono">{host}</span>
          </div>
        </div>

        {metrics ? (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">CPU</span>
                <span className="font-mono">{metrics.cpu.toFixed(1)}%</span>
              </div>
              <ProgressBar value={metrics.cpu} color="cyan" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">RAM</span>
                <span className="font-mono">{metrics.ram.percent.toFixed(1)}%</span>
              </div>
              <ProgressBar value={metrics.ram.percent} color="purple" />
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-white/[0.06]">
              <Badge variant="info">{metrics.os.name.split(" ")[0]}</Badge>
              <span className="text-xs text-muted font-mono">
                {formatUptime(metrics.uptime)}
              </span>
            </div>
          </div>
        ) : hasError ? (
          <div className="text-center py-4">
            <Badge variant="danger">Offline</Badge>
          </div>
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        )}
      </Card>
    </Link>
  );
}
