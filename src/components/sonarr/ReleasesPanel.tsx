"use client";

import { useState } from "react";
import { Search, Download, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatBytes } from "@/lib/utils";

interface Release {
  guid: string;
  quality: { quality: { name: string } };
  age: number;
  size: number;
  indexer: string;
  indexerId: number;
  title: string;
  seeders?: number;
  leechers?: number;
  protocol: string;
  approved: boolean;
  rejections?: string[];
}

interface ReleasesPanelProps {
  seriesId: number;
}

export function ReleasesPanel({ seriesId }: ReleasesPanelProps) {
  const [open, setOpen] = useState(false);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(false);
  const [grabbing, setGrabbing] = useState<string | null>(null);
  const [grabbed, setGrabbed] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (open && releases.length > 0) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch(`/api/sonarr/series/${seriesId}/releases`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReleases(data);
    } catch {
      setReleases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGrab = async (release: Release) => {
    setGrabbing(release.guid);
    try {
      const res = await fetch(`/api/sonarr/series/${seriesId}/releases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guid: release.guid, indexerId: release.indexerId }),
      });
      if (res.ok) {
        setGrabbed((prev) => new Set(prev).add(release.guid));
      }
    } catch {
      // error
    } finally {
      setGrabbing(null);
    }
  };

  return (
    <Card>
      <button
        onClick={handleSearch}
        className="w-full flex items-center justify-between p-0"
      >
        <CardHeader className="mb-0 pb-0 border-0 flex-1">
          <CardTitle className="flex items-center gap-2">
            <Search size={14} className="text-accent-cyan" />
            Manuelle Suche
          </CardTitle>
          <div className="flex items-center gap-2">
            {releases.length > 0 && (
              <Badge variant="info">{releases.length} Releases</Badge>
            )}
            {open ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
          </div>
        </CardHeader>
      </button>

      {open && (
        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <Spinner />
              <span className="text-sm text-muted">Durchsuche Indexer...</span>
            </div>
          ) : releases.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted">
              Keine Releases gefunden
            </div>
          ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {releases.map((release) => (
                <div
                  key={release.guid}
                  className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${
                    release.approved
                      ? "bg-white/[0.02] hover:bg-white/[0.04]"
                      : "bg-white/[0.01] opacity-60"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs truncate mb-1" title={release.title}>
                      {release.title}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="info">{release.quality.quality.name}</Badge>
                      <Badge variant="default">{release.indexer}</Badge>
                      <Badge variant="default">{formatBytes(release.size)}</Badge>
                      {release.seeders !== undefined && (
                        <Badge variant={release.seeders > 0 ? "success" : "danger"}>
                          {release.seeders} Seed
                        </Badge>
                      )}
                      <Badge variant="default">
                        {release.protocol === "torrent" ? "Torrent" : "Usenet"}
                      </Badge>
                      {!release.approved && release.rejections && (
                        <Badge variant="danger">
                          <X size={10} className="mr-1" />
                          {release.rejections.length} Ablehnungen
                        </Badge>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleGrab(release)}
                    disabled={!release.approved || grabbing === release.guid || grabbed.has(release.guid)}
                    className={`p-2 rounded-lg transition-colors shrink-0 ${
                      grabbed.has(release.guid)
                        ? "text-accent-emerald"
                        : "text-accent-cyan hover:bg-accent-cyan/20 disabled:opacity-30"
                    }`}
                    title={grabbed.has(release.guid) ? "Hinzugefügt" : "Herunterladen"}
                  >
                    {grabbing === release.guid ? (
                      <Spinner className="h-4 w-4" />
                    ) : grabbed.has(release.guid) ? (
                      <Check size={16} />
                    ) : (
                      <Download size={16} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
