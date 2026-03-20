"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
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
  Mail,
  Calendar,
  Clock,
  Crown,
  Shield,
  Copy,
  Check,
} from "lucide-react";

interface IndexerData {
  name: string;
  url: string;
  online: boolean;
  error?: string;
  user: {
    username: string;
    email: string;
    grabs: number;
    role: string;
    apiRequests: number;
    downloadRequests: number;
    createdAt: string;
    lastLogin: string;
    expiresAt: string;
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
    categories: { id: string; name: string }[];
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
  const [configIndexers, setConfigIndexers] = useState<
    { name: string; url: string; apiKey: string }[]
  >([]);

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
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin" : ""}
            />
            Aktualisieren
          </button>
        )}
      </PageHeader>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          className={tabClass("dashboard")}
          onClick={() => setTab("dashboard")}
        >
          <span className="flex items-center gap-2">
            <Activity size={14} />
            Dashboard
          </span>
        </button>
        <button
          className={tabClass("settings")}
          onClick={() => setTab("settings")}
        >
          <span className="flex items-center gap-2">
            <Settings size={14} />
            Einstellungen
          </span>
        </button>
      </div>

      {tab === "dashboard" && (
        <DashboardTab
          indexers={indexers}
          configIndexers={configIndexers}
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
  configIndexers,
  loading,
  onSwitchToSettings,
}: {
  indexers: IndexerData[];
  configIndexers: { name: string; url: string; apiKey: string }[];
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
          <h3 className="text-lg font-medium mb-2">
            Keine Indexer konfiguriert
          </h3>
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
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {indexers.map((indexer, idx) => (
        <IndexerDashboard
          key={indexer.url}
          indexer={indexer}
          apiKey={configIndexers[idx]?.apiKey || ""}
        />
      ))}
    </div>
  );
}

// --- Indexer Dashboard (compact single card) ---

function IndexerDashboard({
  indexer,
  apiKey,
}: {
  indexer: IndexerData;
  apiKey: string;
}) {
  const { user, limits } = indexer;
  const [copied, setCopied] = useState(false);

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!indexer.online) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent-red/10 flex items-center justify-center">
              <Database size={18} className="text-accent-red" />
            </div>
            <div>
              <CardTitle>{indexer.name}</CardTitle>
              <span className="text-xs text-muted">{indexer.url}</span>
            </div>
          </div>
          <StatusDot status="offline" />
        </CardHeader>
        <div className="p-3 rounded-lg bg-accent-red/10 text-accent-red text-sm">
          Nicht erreichbar{indexer.error ? `: ${indexer.error}` : ""}
        </div>
      </Card>
    );
  }

  const grabsRemaining = limits && limits.grabMax > 0 ? limits.grabMax - limits.grabCurrent : null;
  const grabsPercent = limits && limits.grabMax > 0 ? (limits.grabCurrent / limits.grabMax) * 100 : 0;
  const apiPercent = limits && limits.apiMax > 0 ? (limits.apiCurrent / limits.apiMax) * 100 : 0;

  return (
    <Card>
      {/* Header */}
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-accent-amber/10 flex items-center justify-center shadow-[0_0_10px_-3px_rgba(251,191,36,0.3)]">
            <Database size={18} className="text-accent-amber" />
          </div>
          <div>
            <CardTitle>{indexer.name}</CardTitle>
            <span className="text-xs text-muted">{indexer.url}</span>
          </div>
        </div>
        <StatusDot status="online" />
      </CardHeader>

      {/* User Info rows */}
      {user && (
        <div className="space-y-1.5 mb-4">
          {user.username && <UserInfoRow icon={<User size={12} />} label="Username" value={user.username} />}
          {user.email && <UserInfoRow icon={<Mail size={12} />} label="Email" value={user.email} verified />}
          {user.role && (
            <UserInfoRow
              icon={<Crown size={12} />}
              label="Rolle"
              value={
                <Badge variant={user.role.toLowerCase().includes("supporter") || user.role.toLowerCase().includes("vip") ? "warning" : "default"}>
                  {user.role}
                </Badge>
              }
            />
          )}
          {user.expiresAt && (
            <UserInfoRow icon={<Shield size={12} />} label="Läuft ab" value={<span className="text-accent-emerald font-medium">{user.expiresAt}</span>} />
          )}
        </div>
      )}

      {/* API Key */}
      {apiKey && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <Key size={12} className="text-muted flex-shrink-0" />
            <span className="text-[10px] text-muted">API Key</span>
          </div>
          <div className="flex items-center gap-1.5">
            <code className="text-[10px] text-accent-cyan font-mono truncate max-w-[140px]">{apiKey}</code>
            <button onClick={copyKey} className="p-0.5 rounded hover:bg-white/[0.08] transition-colors" title="Kopieren">
              {copied ? <Check size={12} className="text-accent-emerald" /> : <Copy size={12} className="text-muted" />}
            </button>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <Activity size={12} className="text-accent-cyan mx-auto mb-1" />
          <div className="text-lg font-bold tabular-nums">{limits?.apiCurrent ?? 0}</div>
          <div className="text-[9px] text-muted">API 24h</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <Download size={12} className="text-accent-emerald mx-auto mb-1" />
          <div className="text-lg font-bold tabular-nums">{limits?.grabCurrent ?? 0}</div>
          <div className="text-[9px] text-muted">Grabs 24h</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <Database size={12} className="text-accent-purple mx-auto mb-1" />
          <div className="text-lg font-bold tabular-nums">{user?.grabs?.toLocaleString("de-DE") ?? 0}</div>
          <div className="text-[9px] text-muted">Grabs Total</div>
        </div>
      </div>

      {/* Downloads Limit Bar */}
      {limits && limits.grabMax > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Download size={12} className="text-accent-emerald" />
              Downloads
            </span>
            <span className="text-xs tabular-nums">
              <span className="font-semibold">{grabsRemaining}</span>
              <span className="text-muted"> / {limits.grabMax} frei</span>
            </span>
          </div>
          <div className="relative h-5 rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                grabsPercent > 90
                  ? "bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_15px_-4px_rgba(239,68,68,0.5)]"
                  : grabsPercent > 70
                  ? "bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_15px_-4px_rgba(245,158,11,0.5)]"
                  : "bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_-4px_rgba(16,185,129,0.5)]"
              }`}
              style={{ width: `${Math.min(grabsPercent, 100)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold drop-shadow-lg">{grabsPercent.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* API Limit Bar */}
      {limits && limits.apiMax > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Activity size={12} className="text-accent-cyan" />
              API Requests
            </span>
            <span className="text-xs tabular-nums">
              <span className="font-semibold">{limits.apiMax - limits.apiCurrent}</span>
              <span className="text-muted"> / {limits.apiMax} frei</span>
            </span>
          </div>
          <div className="relative h-5 rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                apiPercent > 90
                  ? "bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_15px_-4px_rgba(239,68,68,0.5)]"
                  : apiPercent > 70
                  ? "bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_15px_-4px_rgba(245,158,11,0.5)]"
                  : "bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_15px_-4px_rgba(34,211,238,0.5)]"
              }`}
              style={{ width: `${Math.min(apiPercent, 100)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold drop-shadow-lg">{apiPercent.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Unlimited notice */}
      {limits && limits.apiMax === 0 && limits.grabMax === 0 && (
        <div className="text-center py-2 text-xs text-muted">
          ∞ API & Downloads unlimited
        </div>
      )}
    </Card>
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

  const saveAll = async (
    updated: { name: string; url: string; apiKey: string }[]
  ) => {
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
    const updated = [
      ...indexers,
      { name: newName, url: newUrl.replace(/\/$/, ""), apiKey: newApiKey },
    ];
    await saveAll(updated);
    setNewName("");
    setNewUrl("");
    setNewApiKey("");
    setAdding(false);
  };

  const handleRemove = async (idx: number) => {
    if (!confirm(`Indexer "${indexers[idx].name}" wirklich entfernen?`))
      return;
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
        Newznab-kompatible Usenet Indexer. API Key findest du auf der
        Profilseite deines Indexers.
      </p>

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
              onClick={() => {
                setAdding(false);
                setNewName("");
                setNewUrl("");
                setNewApiKey("");
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/[0.08] text-sm hover:bg-white/[0.04] transition-colors"
            >
              <X size={14} />
              Abbrechen
            </button>
          </div>
        </div>
      )}

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
            Noch keine Indexer konfiguriert. Klicke &quot;Hinzuf&uuml;gen&quot;
            um zu starten.
          </div>
        )}
      </div>
    </Card>
  );
}

// --- UI Components ---

function UserInfoRow({
  icon,
  label,
  value,
  verified,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  verified?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{value}</span>
        {verified && (
          <Check size={13} className="text-accent-emerald" />
        )}
      </div>
    </div>
  );
}

