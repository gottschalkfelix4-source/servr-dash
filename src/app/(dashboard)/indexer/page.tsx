"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Database,
  User,
  Key,
  Download,
  Activity,
  RefreshCw,
  Settings,
} from "lucide-react";

interface IndexerData {
  name: string;
  url: string;
  online: boolean;
  error?: string;
  user: {
    username: string;
    grabs: number;
    role: string;
    apiRequests: number;
    downloadRequests: number;
    createdAt: string;
  } | null;
  limits: {
    apiCurrent: number;
    apiMax: number;
    grabCurrent: number;
    grabMax: number;
    apiOldestTime: string;
    grabOldestTime: string;
  } | null;
  caps: {
    serverTitle: string;
    email: string;
    retention: number;
    categories: { id: string; name: string; subCategories?: { id: string; name: string }[] }[];
    searchAvailable: boolean;
    tvSearchAvailable: boolean;
    movieSearchAvailable: boolean;
  } | null;
}

export default function IndexerPage() {
  const [indexers, setIndexers] = useState<IndexerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/indexer");
      const data = await res.json();
      setIndexers(data.indexers || []);
    } catch {
      setIndexers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Indexer" description="Usenet Indexer Status" />
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </div>
    );
  }

  if (indexers.length === 0) {
    return (
      <div>
        <PageHeader title="Indexer" description="Usenet Indexer Status" />
        <Card>
          <div className="text-center py-12">
            <Database size={48} className="mx-auto text-muted mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Indexer konfiguriert</h3>
            <p className="text-sm text-muted mb-4">
              Füge Indexer über die Einstellungen hinzu.
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-cyan/10 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
            >
              <Settings size={14} />
              Zu den Einstellungen
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Indexer" description="Usenet Indexer Status">
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan/10 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Aktualisieren
        </button>
      </PageHeader>

      <div className="space-y-6">
        {indexers.map((indexer) => (
          <IndexerCard key={indexer.url} indexer={indexer} />
        ))}
      </div>
    </div>
  );
}

function IndexerCard({ indexer }: { indexer: IndexerData }) {
  const { user, limits, caps } = indexer;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent-amber/10 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(251,191,36,0.3)]">
            <Database size={20} className="text-accent-amber" />
          </div>
          <div>
            <CardTitle>{indexer.name}</CardTitle>
            <span className="text-xs text-muted">{indexer.url}</span>
          </div>
        </div>
        <StatusDot status={indexer.online ? "online" : "offline"} />
      </CardHeader>

      {!indexer.online && (
        <div className="p-3 rounded-lg bg-accent-red/10 text-accent-red text-sm">
          Nicht erreichbar{indexer.error ? `: ${indexer.error}` : ""}
        </div>
      )}

      {indexer.online && (
        <div className="space-y-4">
          {/* User Info + API Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Info */}
            {user && (
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-3">
                  <User size={14} className="text-accent-cyan" />
                  <span className="text-sm font-medium">Account</span>
                </div>
                <div className="space-y-2">
                  <InfoRow label="Username" value={user.username} />
                  <InfoRow
                    label="Rolle"
                    value={
                      <Badge variant={user.role === "Supporter" ? "warning" : "default"}>
                        {user.role}
                      </Badge>
                    }
                  />
                  <InfoRow label="Grabs Total" value={user.grabs.toLocaleString("de-DE")} highlight />
                  {user.createdAt && (
                    <InfoRow label="Registriert" value={user.createdAt} />
                  )}
                </div>
              </div>
            )}

            {/* API Stats */}
            {limits && (
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-3">
                  <Key size={14} className="text-accent-purple" />
                  <span className="text-sm font-medium">API & Stats</span>
                </div>
                <div className="space-y-3">
                  {/* API Usage */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Activity size={12} className="text-accent-cyan" />
                        <span className="text-xs text-muted">API (24h)</span>
                      </div>
                      <span className="text-xs font-mono">
                        {limits.apiCurrent}
                        {limits.apiMax > 0 ? ` / ${limits.apiMax}` : " / \u221e"}
                      </span>
                    </div>
                    {limits.apiMax > 0 && (
                      <ProgressBar
                        value={limits.apiCurrent}
                        max={limits.apiMax}
                        color={
                          limits.apiCurrent / limits.apiMax > 0.9
                            ? "red"
                            : limits.apiCurrent / limits.apiMax > 0.7
                            ? "amber"
                            : "cyan"
                        }
                      />
                    )}
                  </div>

                  {/* Grabs Usage */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Download size={12} className="text-accent-emerald" />
                        <span className="text-xs text-muted">Downloads (24h)</span>
                      </div>
                      <span className="text-xs font-mono">
                        {limits.grabCurrent}
                        {limits.grabMax > 0 ? ` / ${limits.grabMax}` : " / \u221e"}
                      </span>
                    </div>
                    {limits.grabMax > 0 && (
                      <ProgressBar
                        value={limits.grabCurrent}
                        max={limits.grabMax}
                        color={
                          limits.grabCurrent / limits.grabMax > 0.9
                            ? "red"
                            : limits.grabCurrent / limits.grabMax > 0.7
                            ? "amber"
                            : "emerald"
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Server Info */}
          {caps && (
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-3">
                <Database size={14} className="text-accent-amber" />
                <span className="text-sm font-medium">Server</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {caps.serverTitle && (
                  <MiniStat label="Server" value={caps.serverTitle} />
                )}
                {caps.retention > 0 && (
                  <MiniStat label="Retention" value={`${caps.retention} Tage`} />
                )}
                <MiniStat
                  label="Kategorien"
                  value={caps.categories.length.toString()}
                />
                <MiniStat
                  label="Suchen"
                  value={[
                    caps.searchAvailable && "NZB",
                    caps.tvSearchAvailable && "TV",
                    caps.movieSearchAvailable && "Film",
                  ]
                    .filter(Boolean)
                    .join(", ") || "Keine"}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-xs ${highlight ? "font-semibold text-accent-cyan" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-white/[0.02]">
      <div className="text-sm font-medium">{value}</div>
      <div className="text-[10px] text-muted mt-0.5">{label}</div>
    </div>
  );
}
