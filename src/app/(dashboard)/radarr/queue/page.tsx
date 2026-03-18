"use client";

import { Download, Trash2, Film } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatBytes } from "@/lib/utils";
import { useRadarrQueue, deleteQueueItem } from "@/hooks/useRadarr";

export default function RadarrQueuePage() {
  const { data: queueData, isLoading, mutate } = useRadarrQueue();

  const records = queueData?.records || [];

  const handleDelete = async (id: number) => {
    if (!confirm("Download wirklich entfernen?")) return;
    await deleteQueueItem(id);
    mutate();
  };

  return (
    <div>
      <PageHeader
        title="Download-Queue"
        description="Aktive Radarr-Downloads"
        actions={
          <Badge variant="info">
            <Download size={12} className="mr-1" />
            {records.length} Aktiv
          </Badge>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : records.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Download size={48} className="mx-auto text-muted/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">Queue ist leer</h3>
            <p className="text-sm text-muted">
              Aktuell werden keine Filme heruntergeladen.
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-xs font-medium text-muted">
                    Titel
                  </th>
                  <th className="pb-3 text-xs font-medium text-muted">
                    Qualit\ät
                  </th>
                  <th className="pb-3 text-xs font-medium text-muted">
                    Gr\ö\ße
                  </th>
                  <th className="pb-3 text-xs font-medium text-muted w-48">
                    Fortschritt
                  </th>
                  <th className="pb-3 text-xs font-medium text-muted">
                    Status
                  </th>
                  <th className="pb-3 text-xs font-medium text-muted">
                    Restzeit
                  </th>
                  <th className="pb-3 text-xs font-medium text-muted">
                    Client
                  </th>
                  <th className="pb-3 text-xs font-medium text-muted w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((item) => {
                  const progress =
                    item.size > 0
                      ? ((item.size - item.sizeleft) / item.size) * 100
                      : 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Film size={14} className="text-muted shrink-0" />
                          <span className="truncate max-w-[250px]">
                            {item.movie?.title || item.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="info">
                          {item.quality.quality.name}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted">
                        {formatBytes(item.size)}
                      </td>
                      <td className="py-3 pr-4">
                        <ProgressBar
                          value={progress}
                          color="cyan"
                          showLabel
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={
                            item.trackedDownloadState === "importPending"
                              ? "success"
                              : item.trackedDownloadStatus === "warning"
                                ? "warning"
                                : "default"
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted font-mono text-xs">
                        {item.timeleft || "\u2013"}
                      </td>
                      <td className="py-3 pr-4 text-muted text-xs">
                        {item.downloadClient || "\u2013"}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg hover:bg-accent-red/20 text-accent-red transition-colors"
                          title="Entfernen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
