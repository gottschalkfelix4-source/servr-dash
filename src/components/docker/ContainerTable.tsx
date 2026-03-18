"use client";

import { useState, memo } from "react";
import { Badge } from "@/components/ui/Badge";
import { Play, Square, RotateCw, Trash2 } from "lucide-react";
import { performContainerAction } from "@/hooks/useDocker";
import type { DockerContainer } from "@/types/docker";
import Link from "next/link";

interface ContainerTableProps {
  containers: DockerContainer[];
  serverId: string;
  onRefresh: () => void;
}

const stateVariant: Record<string, "success" | "danger" | "warning" | "default"> = {
  running: "success",
  exited: "danger",
  paused: "warning",
  restarting: "warning",
  dead: "danger",
  created: "default",
};

export const ContainerTable = memo(function ContainerTable({
  containers,
  serverId,
  onRefresh,
}: ContainerTableProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (containerId: string, action: string) => {
    if (action === "remove" && !confirm("Container wirklich entfernen?")) return;
    setLoading(containerId);
    try {
      await performContainerAction(serverId, containerId, action);
      setTimeout(onRefresh, 500);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="px-3 py-2 text-left text-xs font-medium text-muted">
              Name
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted">
              Image
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted">
              Status
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted">
              Ports
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted">
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody>
          {containers.map((c) => (
            <tr
              key={c.id}
              className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
            >
              <td className="px-3 py-2">
                <Link
                  href={`/docker/${serverId}/${c.id}`}
                  className="text-accent-cyan hover:underline font-medium"
                >
                  {c.name}
                </Link>
              </td>
              <td className="px-3 py-2 text-xs font-mono text-muted truncate max-w-[200px]">
                {c.image}
              </td>
              <td className="px-3 py-2">
                <Badge variant={stateVariant[c.state] || "default"}>
                  {c.state}
                </Badge>
              </td>
              <td className="px-3 py-2 text-xs font-mono text-muted truncate max-w-[200px]">
                {c.ports || "—"}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center justify-end gap-1">
                  {c.state !== "running" && (
                    <button
                      onClick={() => handleAction(c.id, "start")}
                      disabled={loading === c.id}
                      className="p-1.5 rounded hover:bg-accent-emerald/20 text-accent-emerald transition-colors disabled:opacity-50"
                      title="Starten"
                    >
                      <Play size={14} />
                    </button>
                  )}
                  {c.state === "running" && (
                    <button
                      onClick={() => handleAction(c.id, "stop")}
                      disabled={loading === c.id}
                      className="p-1.5 rounded hover:bg-accent-amber/20 text-accent-amber transition-colors disabled:opacity-50"
                      title="Stoppen"
                    >
                      <Square size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(c.id, "restart")}
                    disabled={loading === c.id}
                    className="p-1.5 rounded hover:bg-accent-cyan/20 text-accent-cyan transition-colors disabled:opacity-50"
                    title="Neustarten"
                  >
                    <RotateCw size={14} />
                  </button>
                  <button
                    onClick={() => handleAction(c.id, "remove")}
                    disabled={loading === c.id}
                    className="p-1.5 rounded hover:bg-accent-red/20 text-accent-red transition-colors disabled:opacity-50"
                    title="Entfernen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
