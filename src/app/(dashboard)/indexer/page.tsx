"use client";

import { useEffect, useState, useCallback } from "react";
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
  Plus,
  Trash2,
  Save,
  X,
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

type Tab = "dashboard" | "settings";

export default function IndexerPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [indexers, setIndexers] = useState<IndexerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [configIndexers, setConfigIndexers] = useState<{ name: string; url: string; apiKey: string }[]>([]);

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

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setConfigIndexers(data.indexers || []);
    } catch {
      setConfigIndexers([]);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadConfig();
  }, [loadData, loadConfig]);

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
      tab === t
        ? "bg-accent-cyan/10 text-accent-cyan shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)]"
        : "text-muted hover:text-foreground hover:bg-white/[0.04]"
    }`;

  return (
    <div>
      <PageHeader title="Indexer" description="Usenet Indexer Status">
        {tab === "dashboard" && (
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan/10 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Aktualisieren
          </button>
        )}
      </PageHeader>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button className={tabClass("dashboard")} onClick={() => setTab("dashboard")}>
          <span className="flex items-center gap-2">
            <Activity size={14} />
            Dashboard
          </span>
        </button>
        <button className={tabClass("settings")} onClick={() => setTab("settings")}>
          <span className="flex items-center gap-2">
            <Settings size={14} />
            Einstellungen
          </span>
        </button>
      </div>

      {tab === "dashboard" && (
        <DashboardTab
          indexers={indexers}
          loading={loading}
          onSwitchToSettings={() => setTab("settings")}
        />
      )}

      {tab === "settings" && (
        <SettingsTab
          configIndexers={configIndexers}
          onSaved={() => {
            loadConfig();
            loadData(true);
          }}
        />
      )}
    </div>
  );
}

// --- Dashboard Tab ---

function DashboardTab({
  indexers,
  loading,
  onSwitchToSettings,
}: {
  indexers: IndexerData[];
  loading: boolean;
  onSwitchToSettings: () => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (indexers.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Database size={48} className="mx-auto text-muted mb-4" />
          <h3 className="text-lg font-medium mb-2">Keine Indexer konfiguriert</h3>
          <p className="text-sm text-muted mb-4">
            Füge Indexer über die Einstellungen hinzu.
          </p>
          <button
            onClick={onSwitchToSettings}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-cyan/10 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
          >
            <Settings size={14} />
            Zu den Einstellungen
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {indexers.map((indexer) => (
        <IndexerCard key={indexer.url} indexer={indexer} />
      ))}
    </div>
  );
}

// --- Settings Tab ---

function SettingsTab({
  configIndexers,
  onSaved,
}: {
  configIndexers: { name: string; url: string; apiKey: string }[];
  onSaved: () => void;
}) {
  const [indexers, setIndexers] = useState(configIndexers);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIndexers(configIndexers);
  }, [configIndexers]);

  const saveAll = async (updated: { name: string; url: string; apiKey: string }[]) => {
    setSaving(true);
    try {
      const configRes = await fetch("/api/config");
      const config = await configRes.json();
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, indexers: updated }),
      });
      setIndexers(updated);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newName || !newUrl || !newApiKey) return;
    const updated = [...indexers, { name: newName, url: newUrl.replace(/\/$/, ""), apiKey: newApiKey }];
    await saveAll(updated);
    setNewName("");
    setNewUrl("");
    setNewApiKey("");
    setAdding(false);
  };

  const handleRemove = async (idx: number) => {
    if (!confirm(`Indexer "${indexers[idx].name}" wirklich entfernen?`)) return;
    await saveAll(indexers.filter((_, i) => i !== idx));
  };

  const inputClass =
    "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)] transition-all duration-200";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Indexer verwalten</CardTitle>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan/10 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
        >
          <Plus size={14} />
          Hinzufügen
        </button>
      </CardHeader>

      <p className="text-xs text-muted mb-4">
        Newznab-kompatible Usenet Indexer. API Key findest du auf der Profilseite deines Indexers.
      </p>

      {/* Add form */}
      {adding && (
        <div className="p-4 rounded-lg border border-white/[0.06] bg-card backdrop-blur-xl mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs text-muted mb-1 block">Name</label>
              <input
                className={inputClass}
                placeholder="z.B. SceneNZBs"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">URL</label>
              <input
                className={inputClass}
                placeholder="https://scenenzbs.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">API Key</label>
              <input
                className={inputClass}
                type="password"
                placeholder="API Key vom Profil"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !newName || !newUrl || !newApiKey}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-cyan text-background text-sm font-medium hover:bg-accent-cyan/90 transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Speichern..." : "Hinzufügen"}
            </button>
            <button
              onClick={() => { setAdding(false); setNewName(""); setNewUrl(""); setNewApiKey(""); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/[0.08] text-sm hover:bg-white/[0.04] transition-colors"
            >
              <X size={14} />
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Indexer list */}
      <div className="space-y-2">
        {indexers.map((indexer, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-accent-amber/10 flex items-center justify-center shadow-[0_0_10px_-3px_rgba(251,191,36,0.3)]">
                <Database size={16} className="text-accent-amber" />
              </div>
              <div>
                <span className="font-medium text-sm">{indexer.name}</span>
                <span className="text-xs text-muted block">{indexer.url}</span>
              </div>
            </div>
            <button
              onClick={() => handleRemove(idx)}
              className="p-1.5 rounded hover:bg-accent-red/20 text-muted hover:text-accent-red transition-colors"
              title="Entfernen"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {indexers.length === 0 && !adding && (
          <div className="text-center py-8 text-sm text-muted">
            Noch keine Indexer konfiguriert. Klicke &quot;Hinzuf&uuml;gen&quot; um zu starten.
          </div>
        )}
      </div>
    </Card>
  );
}

// --- Indexer Card ---

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {limits && (
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-3">
                  <Key size={14} className="text-accent-purple" />
                  <span className="text-sm font-medium">API & Stats</span>
                </div>
                <div className="space-y-3">
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
                <MiniStat label="Kategorien" value={caps.categories.length.toString()} />
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
