"use client";

import { Download, Trash2, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Spinner } from "@/components/ui/Spinner";
import { formatBytes } from "@/lib/utils";
import { useSonarrQueue, deleteQueueItem } from "@/hooks/useSonarr";
import Link from "next/link";
import { useState } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export default function QueuePage() {
  const { data: queueData, isLoading, mutate } = useSonarrQueue();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const records = queueData?.records || [];

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteQueueItem(id);
      mutate();
    } catch {
      // error
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <Link
        href="/sonarr"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        Zurück zu Sonarr
      </Link>

      <PageHeader
        title="Warteschlange"
        description={`${queueData?.totalRecords ?? 0} Downloads`}
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : records.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Download size={48} className="mx-auto text-muted mb-4" />
            <p className="text-sm text-muted">
              Keine Downloads in der Warteschlange
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs text-muted font-medium">
                    Serie
                  </th>
                  <th className="text-left py-3 px-3 text-xs text-muted font-medium">
                    Episode
                  </th>
                  <th className="text-left py-3 px-3 text-xs text-muted font-medium hidden md:table-cell">
                    Qualität
                  </th>
                  <th className="text-left py-3 px-3 text-xs text-muted font-medium hidden sm:table-cell">
                    Größe
                  </th>
                  <th className="text-left py-3 px-3 text-xs text-muted font-medium">
                    Fortschritt
                  </th>
                  <th className="text-left py-3 px-3 text-xs text-muted font-medium hidden lg:table-cell">
                    Status
                  </th>
                  <th className="text-left py-3 px-3 text-xs text-muted font-medium hidden lg:table-cell">
                    Verbleibend
                  </th>
                  <th className="text-left py-3 px-3 text-xs text-muted font-medium hidden xl:table-cell">
                    Client
                  </th>
                  <th className="py-3 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((item) => {
                  const progress =
                    item.size > 0
                      ? ((item.size - item.sizeleft) / item.size) * 100
                      : 0;
                  const epCode = item.episode
                    ? `S${pad(item.episode.seasonNumber)}E${pad(item.episode.episodeNumber)}`
                    : "";

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-2.5 px-3 font-medium truncate max-w-[180px]">
                        {item.series?.title || "---"}
                      </td>
                      <td className="py-2.5 px-3 text-muted">
                        <span className="font-mono text-xs">{epCode}</span>
                        {item.episode && (
                          <span className="ml-1.5 hidden sm:inline">
                            {item.episode.title}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 hidden md:table-cell">
                        <Badge variant="info">
                          {item.quality?.quality?.name || "---"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-muted hidden sm:table-cell">
                        {formatBytes(item.size)}
                      </td>
                      <td className="py-2.5 px-3 w-32">
                        <ProgressBar
                          value={progress}
                          max={100}
                          color="cyan"
                        />
                      </td>
                      <td className="py-2.5 px-3 hidden lg:table-cell">
                        <Badge
                          variant={
                            item.trackedDownloadStatus === "warning"
                              ? "warning"
                              : item.status === "completed"
                                ? "success"
                                : "default"
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted hidden lg:table-cell">
                        {item.timeleft || "---"}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted hidden xl:table-cell">
                        {item.downloadClient || "---"}
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1.5 rounded-lg hover:bg-accent-red/15 text-muted hover:text-accent-red transition-colors disabled:opacity-50"
                          title="Entfernen"
                        >
                          {deletingId === item.id ? (
                            <Spinner className="h-3.5 w-3.5" />
                          ) : (
                            <Trash2 size={14} />
                          )}
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
