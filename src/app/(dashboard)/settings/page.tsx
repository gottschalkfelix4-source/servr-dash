"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Server,
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Tv,
  LogOut,
  ExternalLink,
  Film,
  Clapperboard,
  Users,
  UserPlus,
  Shield,
  TrendingUp,
  Globe,
  MessageSquare,
  Database,
} from "lucide-react";
import type { ServerConfig, AppConfig } from "@/types/server";
import type { SafeUser } from "@/types/auth";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Einstellungen"
        description="Server, Plex, Radarr & Sonarr Konfiguration"
      />
      <div className="space-y-6">
        <ServerSettings />
        <PlexSettings />
        <ArrSettings
          label="Radarr"
          icon={<Film size={16} className="text-accent-amber" />}
          configKey="radarr"
          defaultPort={7878}
          statusEndpoint="/api/radarr/status"
        />
        <ArrSettings
          label="Sonarr"
          icon={<Clapperboard size={16} className="text-accent-cyan" />}
          configKey="sonarr"
          defaultPort={8989}
          statusEndpoint="/api/sonarr/status"
        />
        <CloudflareSettings />
        <TmdbSettings />
        <IndexerSettings />
        <OpenClawSettings />
        <UserManagement />
      </div>
    </div>
  );
}

// --- Server Settings ---

function ServerSettings() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/config");
    const data = await res.json();
    setConfig(data);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const saveServers = async (servers: ServerConfig[]) => {
    if (!config) return;
    setSaving(true);
    try {
      const newConfig = { ...config, servers };
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
      setConfig(newConfig);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (serverId: string) => {
    if (!config) return;
    if (!confirm("Server wirklich entfernen?")) return;
    await saveServers(config.servers.filter((s) => s.id !== serverId));
  };

  const handleSave = async (server: ServerConfig) => {
    if (!config) return;
    const exists = config.servers.find((s) => s.id === server.id);
    const servers = exists
      ? config.servers.map((s) => (s.id === server.id ? server : s))
      : [...config.servers, server];
    await saveServers(servers);
    setEditing(null);
    setAdding(false);
  };

  if (!config) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Monitoring</CardTitle>
        <button
          onClick={() => {
            setAdding(true);
            setEditing(null);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan/10 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
        >
          <Plus size={14} />
          Server hinzufügen
        </button>
      </CardHeader>

      {/* Add new server form */}
      {adding && (
        <ServerForm
          onSave={handleSave}
          onCancel={() => setAdding(false)}
          saving={saving}
        />
      )}

      {/* Server list */}
      <div className="space-y-3">
        {config.servers.map((server) =>
          editing === server.id ? (
            <ServerForm
              key={server.id}
              server={server}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
              saving={saving}
            />
          ) : (
            <ServerRow
              key={server.id}
              server={server}
              onEdit={() => {
                setEditing(server.id);
                setAdding(false);
              }}
              onDelete={() => handleDelete(server.id)}
            />
          )
        )}

        {config.servers.length === 0 && !adding && (
          <div className="text-center py-8 text-sm text-muted">
            Noch keine Server konfiguriert.
          </div>
        )}
      </div>
    </Card>
  );
}

function ServerRow({
  server,
  onEdit,
  onDelete,
}: {
  server: ServerConfig;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-accent-cyan/10 flex items-center justify-center shadow-[0_0_10px_-3px_rgba(34,211,238,0.3)]">
          <Server size={16} className="text-accent-cyan" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{server.name}</span>
            <Badge variant={server.metricsSource === "local" ? "success" : "default"}>
              {server.metricsSource === "local" ? "Lokal" : "SSH"}
            </Badge>
            {server.dockerEnabled && (
              <Badge variant="info">Docker</Badge>
            )}
          </div>
          <span className="text-xs text-muted">
            {server.metricsSource === "local"
              ? "Lokale Metriken aus der App-Umgebung"
              : `${server.username}@${server.host}:${server.port}`}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="p-1.5 rounded hover:bg-card text-muted hover:text-foreground transition-colors"
          title="Bearbeiten"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-accent-red/20 text-muted hover:text-accent-red transition-colors"
          title="Entfernen"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function ServerForm({
  server,
  onSave,
  onCancel,
  saving,
}: {
  server?: ServerConfig;
  onSave: (server: ServerConfig) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<ServerConfig>(
    server || {
      id: "",
      name: "",
      metricsSource: "ssh",
      host: "",
      port: 22,
      username: "root",
      authMethod: "password",
      password: "",
      privateKeyPath: "",
      dockerEnabled: false,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isLocal = form.metricsSource === "local";
    const serverToSave = {
      ...form,
      host: isLocal ? "localhost" : form.host,
      port: isLocal ? 0 : form.port,
      username: isLocal ? "" : form.username,
      authMethod: isLocal ? ("password" as const) : form.authMethod,
      password: isLocal ? "" : form.password,
      privateKeyPath: isLocal ? "" : form.privateKeyPath,
      id: form.id || form.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    };
    await onSave(serverToSave);
  };

  const inputClass =
    "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)] transition-all duration-200";

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-lg border border-white/[0.06] bg-card backdrop-blur-xl mb-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-muted mb-1 block">Name</label>
          <input
            className={inputClass}
            placeholder="Mein Server"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Metrikquelle</label>
          <select
            className={inputClass}
            value={form.metricsSource || "ssh"}
            onChange={(e) =>
              setForm({
                ...form,
                metricsSource: e.target.value as "ssh" | "local",
              })
            }
          >
            <option value="ssh">SSH Remote-Server</option>
            <option value="local">Lokal / App-Host</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Host / IP</label>
          <input
            className={inputClass}
            placeholder="192.168.1.10"
            value={form.host}
            onChange={(e) => setForm({ ...form, host: e.target.value })}
            required={(form.metricsSource || "ssh") === "ssh"}
          />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Port</label>
          <input
            className={inputClass}
            type="number"
            value={form.port}
            onChange={(e) =>
              setForm({ ...form, port: parseInt(e.target.value) || 22 })
            }
          />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Benutzername</label>
          <input
            className={inputClass}
            placeholder="root"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required={(form.metricsSource || "ssh") === "ssh"}
          />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">
            Authentifizierung
          </label>
          <select
            className={inputClass}
            value={form.authMethod}
            onChange={(e) =>
              setForm({
                ...form,
                authMethod: e.target.value as "key" | "password",
              })
            }
          >
            <option value="password">Passwort</option>
            <option value="key">SSH Key</option>
          </select>
        </div>
        {form.authMethod === "password" ? (
          <div>
            <label className="text-xs text-muted mb-1 block">Passwort</label>
            <input
              className={inputClass}
              type="password"
              placeholder="••••••••"
              value={form.password || ""}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
        ) : (
          <div>
            <label className="text-xs text-muted mb-1 block">
              SSH Key Pfad
            </label>
            <input
              className={inputClass}
              placeholder="~/.ssh/id_rsa"
              value={form.privateKeyPath || ""}
              onChange={(e) =>
                setForm({ ...form, privateKeyPath: e.target.value })
              }
            />
          </div>
        )}
      </div>

      {(form.metricsSource || "ssh") === "local" && (
        <div className="mb-4 rounded-lg border border-accent-cyan/15 bg-accent-cyan/5 p-3 text-xs text-muted">
          Lokale Metriken werden dort gesammelt, wo Servr Dash läuft. Im
          Docker-Betrieb ist das ohne Host-Mounts die Container-Sicht; für
          echte Host-Metriken braucht der Container Zugriff auf Host-Prozesse
          und relevante Systempfade.
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.dockerEnabled || false}
            onChange={(e) =>
              setForm({ ...form, dockerEnabled: e.target.checked })
            }
            className="rounded border-border"
          />
          <span className="text-sm">Docker aktiviert</span>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={
            saving ||
            !form.name ||
            ((form.metricsSource || "ssh") === "ssh" && !form.host)
          }
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-cyan text-background text-sm font-medium hover:bg-accent-cyan/90 transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? "Speichern..." : "Speichern"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-background transition-colors"
        >
          <X size={14} />
          Abbrechen
        </button>
      </div>
    </form>
  );
}

// --- Plex Settings ---

function PlexSettings() {
  const [authStatus, setAuthStatus] = useState<{
    hasToken: boolean;
  } | null>(null);
  const [authFlow, setAuthFlow] = useState<{
    pinId: number;
    authUrl: string;
  } | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/plex/auth")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setAuthStatus(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthStatus({ hasToken: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const startLogin = async () => {
    setError(null);
    try {
      const res = await fetch("/api/plex/auth", { method: "POST" });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setAuthFlow({ pinId: data.pinId, authUrl: data.authUrl });

      // Open Plex auth in new window
      window.open(data.authUrl, "_blank", "width=800,height=700");

      // Start polling for auth completion
      setPolling(true);
      pollForAuth(data.pinId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Fehler beim Starten der Anmeldung"
      );
    }
  };

  const pollForAuth = async (pinId: number) => {
    const maxAttempts = 120; // 2 minutes at 1s interval
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      try {
        const res = await fetch(`/api/plex/auth?pinId=${pinId}`);
        const data = await res.json();

        if (data.authenticated) {
          setPolling(false);
          setAuthFlow(null);
          setAuthStatus({ hasToken: true });
          return;
        }
      } catch {
        // continue polling
      }
    }

    setPolling(false);
    setAuthFlow(null);
    setError("Anmeldung abgelaufen. Bitte erneut versuchen.");
  };

  const logout = async () => {
    if (!confirm("Plex Verbindung wirklich trennen?")) return;
    await fetch("/api/plex/auth", { method: "DELETE" });
    setAuthStatus({ hasToken: false });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plex Media Server</CardTitle>
        <Tv size={16} className="text-accent-purple" />
      </CardHeader>

      {!authStatus ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : authStatus.hasToken ? (
        <PlexConnected onLogout={logout} />
      ) : (
        <div className="space-y-4">
          <div className="text-center py-6">
            <Tv size={40} className="mx-auto text-muted mb-3" />
            <h3 className="font-medium mb-2">Plex verbinden</h3>
            <p className="text-sm text-muted mb-4">
              Melde dich mit deinem Plex Account an um deinen Server zu
              verbinden.
            </p>

            {polling ? (
              <div className="flex items-center justify-center gap-3">
                <Spinner />
                <span className="text-sm text-muted">
                  Warte auf Anmeldung im Browser...
                </span>
              </div>
            ) : (
              <button
                onClick={startLogin}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#e5a00d] to-[#f0c040] text-black font-medium text-sm hover:shadow-[0_0_25px_-5px_rgba(229,160,13,0.5)] transition-all duration-300"
              >
                <ExternalLink size={16} />
                Mit Plex anmelden
              </button>
            )}

            {authFlow && !polling && (
              <p className="text-xs text-muted mt-3">
                Falls das Fenster nicht geöffnet wurde:{" "}
                <a
                  href={authFlow.authUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-cyan hover:underline"
                >
                  Hier klicken
                </a>
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-accent-red/10 text-accent-red text-sm">
              {error}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function PlexConnected({ onLogout }: { onLogout: () => void }) {
  const [plexStatus, setPlexStatus] = useState<{
    name: string;
    version: string;
    online: boolean;
    error?: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    let timeout: number | undefined;
    try {
      const controller = new AbortController();
      timeout = window.setTimeout(() => controller.abort(), 5000);
      const response = await fetch("/api/plex/status", {
        signal: controller.signal,
        cache: "no-store",
      });
      const data = await response.json();
      setPlexStatus(data);
    } catch (err) {
      setPlexStatus({
        name: "Plex Server",
        version: "",
        online: false,
        error:
          err instanceof Error && err.name === "AbortError"
            ? "Statusabfrage abgebrochen"
            : "Statusabfrage fehlgeschlagen",
      });
    } finally {
      if (timeout !== undefined) {
        window.clearTimeout(timeout);
      }
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const statusText = checking
    ? "Prüfe Verbindung..."
    : plexStatus?.online
    ? `Verbunden · v${plexStatus.version || "unbekannt"}`
    : plexStatus
    ? `Nicht erreichbar${
        plexStatus.error ? ` · ${plexStatus.error}` : ""
      }`
    : "Noch nicht geprüft";

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-accent-purple/10 flex items-center justify-center">
          <Tv size={20} className="text-accent-purple" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <StatusDot
              status={
                plexStatus?.online ? "online" : plexStatus ? "offline" : "unknown"
              }
            />
            <span className="font-medium text-sm">
              {plexStatus?.name || "Plex Server"}
            </span>
            {checking && <Spinner className="h-3 w-3" />}
          </div>
          <span className="text-xs text-muted">{statusText}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={checkStatus}
          disabled={checking}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-sm hover:bg-white/[0.04] transition-colors disabled:opacity-50"
        >
          {checking ? <Spinner className="h-3 w-3" /> : <Tv size={14} />}
          Prüfen
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-accent-red hover:bg-accent-red/10 transition-colors"
        >
          <LogOut size={14} />
          Trennen
        </button>
      </div>
    </div>
  );
}

// --- Radarr / Sonarr Settings ---

function ArrSettings({
  label,
  icon,
  configKey,
  defaultPort,
  statusEndpoint,
}: {
  label: string;
  icon: React.ReactNode;
  configKey: "radarr" | "sonarr";
  defaultPort: number;
  statusEndpoint: string;
}) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    connected: boolean;
    version?: string;
  } | null>(null);

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/config");
    const data = await res.json();
    setConfig(data);
    const arrConfig = data[configKey];
    if (arrConfig) {
      setUrl(arrConfig.url || "");
      setApiKey(arrConfig.apiKey || "");
    }
  }, [configKey]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (!url || !apiKey) {
      setStatus(null);
      return;
    }
    fetch(statusEndpoint)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setStatus({ connected: true, version: data.version }))
      .catch(() => setStatus({ connected: false }));
  }, [url, apiKey, statusEndpoint]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const newConfig = {
        ...config,
        [configKey]: { url: url.replace(/\/$/, ""), apiKey },
      };
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
      setConfig(newConfig);
      // Re-check status
      setTimeout(() => {
        fetch(statusEndpoint)
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((data) => setStatus({ connected: true, version: data.version }))
          .catch(() => setStatus({ connected: false }));
      }, 500);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!config || !confirm(`${label} Verbindung wirklich entfernen?`)) return;
    setSaving(true);
    try {
      const newConfig = { ...config };
      delete newConfig[configKey];
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
      setConfig(newConfig);
      setUrl("");
      setApiKey("");
      setStatus(null);
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = !!(url && apiKey);
  const inputClass =
    "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)] transition-all duration-200";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        {icon}
      </CardHeader>

      {status?.connected && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] mb-4">
          <div className="flex items-center gap-3">
            <StatusDot status="online" />
            <div>
              <span className="font-medium text-sm">{label} Server</span>
              <span className="text-xs text-muted ml-2">
                v{status.version}
              </span>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-accent-red hover:bg-accent-red/10 transition-colors"
          >
            <LogOut size={14} />
            Trennen
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-muted mb-1 block">URL</label>
          <input
            className={inputClass}
            placeholder={`http://localhost:${defaultPort}`}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">API Key</label>
          <input
            className={inputClass}
            type="password"
            placeholder="API Key aus den Einstellungen"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !url || !apiKey}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-cyan text-background text-sm font-medium hover:bg-accent-cyan/90 transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? "Speichern..." : "Speichern"}
        </button>
        {isConfigured && status?.connected === false && (
          <Badge variant="danger">Nicht erreichbar</Badge>
        )}
      </div>
    </Card>
  );
}

// --- User Management ---

function UserManagement() {
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [adding, setAdding] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const [meRes, usersRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/auth/users"),
      ]);
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (!currentUser || currentUser.role !== "admin") return null;

  const handleAdd = async () => {
    if (!newUsername || !newPassword) return;
    setSaving(true);
    try {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole }),
      });
      if (res.ok) {
        setNewUsername("");
        setNewPassword("");
        setNewRole("user");
        setAdding(false);
        loadUsers();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`User "${username}" wirklich löschen?`)) return;
    await fetch(`/api/auth/users/${id}`, { method: "DELETE" });
    loadUsers();
  };

  const inputClass =
    "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)] transition-all duration-200";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benutzer</CardTitle>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan/10 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
        >
          <UserPlus size={14} />
          Hinzufügen
        </button>
      </CardHeader>

      {adding && (
        <div className="p-4 rounded-lg border border-white/[0.06] bg-card backdrop-blur-xl mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs text-muted mb-1 block">Benutzername</label>
              <input
                className={inputClass}
                placeholder="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Passwort</label>
              <input
                className={inputClass}
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Rolle</label>
              <select
                className={inputClass}
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as "admin" | "user")}
              >
                <option value="user">Benutzer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !newUsername || !newPassword}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-cyan text-background text-sm font-medium hover:bg-accent-cyan/90 transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Speichern..." : "Erstellen"}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-background transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-accent-purple/10 flex items-center justify-center">
                {user.role === "admin" ? (
                  <Shield size={16} className="text-accent-amber" />
                ) : (
                  <Users size={16} className="text-accent-purple" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{user.username}</span>
                  <Badge variant={user.role === "admin" ? "warning" : "default"}>
                    {user.role === "admin" ? "Admin" : "Benutzer"}
                  </Badge>
                </div>
                <span className="text-xs text-muted">
                  Erstellt: {new Date(user.createdAt).toLocaleDateString("de-DE")}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleDelete(user.id, user.username)}
              className="p-1.5 rounded hover:bg-accent-red/20 text-muted hover:text-accent-red transition-colors"
              title="Entfernen"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

// --- Cloudflare Settings ---

function CloudflareSettings() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [apiToken, setApiToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"untested" | "ok" | "error">("untested");

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/config");
    const data = await res.json();
    setConfig(data);
    setApiToken((data.cloudflare as Record<string, unknown>)?.apiToken as string || "");
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const newConfig = { ...config, cloudflare: { apiToken } };
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
      setConfig(newConfig as AppConfig);
      if (apiToken) {
        const res = await fetch("/api/cloudflare/zones");
        setStatus(res.ok ? "ok" : "error");
      } else {
        setStatus("untested");
      }
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)] transition-all duration-200";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cloudflare DNS</CardTitle>
        <Globe size={16} className="text-accent-cyan" />
      </CardHeader>

      <p className="text-xs text-muted mb-4">
        API Token mit &quot;Edit zone DNS&quot; Berechtigung von{" "}
        <a
          href="https://dash.cloudflare.com/profile/api-tokens"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-cyan hover:underline"
        >
          Cloudflare Dashboard
        </a>
        .
      </p>

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs text-muted mb-1 block">API Token</label>
          <input
            className={inputClass}
            type="password"
            placeholder="Token mit DNS-Berechtigungen"
            value={apiToken}
            onChange={(e) => { setApiToken(e.target.value); setStatus("untested"); }}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-cyan text-background text-sm font-medium hover:bg-accent-cyan/90 transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? "..." : "Speichern"}
        </button>
      </div>

      {status === "ok" && (
        <p className="text-xs text-accent-emerald mt-2">✓ Token gültig</p>
      )}
      {status === "error" && (
        <p className="text-xs text-accent-red mt-2">✗ Token ungültig oder keine Berechtigungen</p>
      )}
    </Card>
  );
}

// --- TMDB Settings ---

function TmdbSettings() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"untested" | "ok" | "error">("untested");

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/config");
    const data = await res.json();
    setConfig(data);
    setApiKey((data as Record<string, unknown>).tmdbApiKey as string || "");
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const newConfig = { ...config, tmdbApiKey: apiKey };
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
      setConfig(newConfig as AppConfig);

      // Test the key
      if (apiKey) {
        const res = await fetch("/api/tmdb?type=movie&category=trending");
        setStatus(res.ok ? "ok" : "error");
      } else {
        setStatus("untested");
      }
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)] transition-all duration-200";

  return (
    <Card>
      <CardHeader>
        <CardTitle>TMDB (Vorschläge)</CardTitle>
        <TrendingUp size={16} className="text-accent-emerald" />
      </CardHeader>

      <p className="text-xs text-muted mb-4">
        Für Trending-Vorschläge beim Hinzufügen von Filmen/Serien. API Key von{" "}
        <a
          href="https://www.themoviedb.org/settings/api"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-cyan hover:underline"
        >
          themoviedb.org
        </a>{" "}
        (kostenlos).
      </p>

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs text-muted mb-1 block">API Read Access Token</label>
          <input
            className={inputClass}
            type="password"
            placeholder="eyJhbGciOi..."
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setStatus("untested");
            }}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-cyan text-background text-sm font-medium hover:bg-accent-cyan/90 transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? "..." : "Speichern"}
        </button>
      </div>

      {status === "ok" && (
        <p className="text-xs text-accent-emerald mt-2">✓ Verbindung erfolgreich</p>
      )}
      {status === "error" && (
        <p className="text-xs text-accent-red mt-2">✗ API Key ungültig</p>
      )}
    </Card>
  );
}

// --- Indexer Settings ---

function IndexerSettings() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [indexers, setIndexers] = useState<{ name: string; url: string; apiKey: string }[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/config");
    const data = await res.json();
    setConfig(data);
    setIndexers((data as Record<string, unknown>).indexers as { name: string; url: string; apiKey: string }[] || []);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const saveIndexers = async (updated: { name: string; url: string; apiKey: string }[]) => {
    if (!config) return;
    setSaving(true);
    try {
      const newConfig = { ...config, indexers: updated };
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
      setConfig(newConfig as AppConfig);
      setIndexers(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newName || !newUrl || !newApiKey) return;
    const updated = [...indexers, { name: newName, url: newUrl.replace(/\/$/, ""), apiKey: newApiKey }];
    await saveIndexers(updated);
    setNewName("");
    setNewUrl("");
    setNewApiKey("");
    setAdding(false);
  };

  const handleRemove = async (idx: number) => {
    if (!confirm(`Indexer "${indexers[idx].name}" wirklich entfernen?`)) return;
    const updated = indexers.filter((_, i) => i !== idx);
    await saveIndexers(updated);
  };

  const inputClass =
    "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)] transition-all duration-200";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usenet Indexer</CardTitle>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan/10 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
        >
          <Plus size={14} />
          Hinzufügen
        </button>
      </CardHeader>

      <p className="text-xs text-muted mb-4">
        Newznab-kompatible Usenet Indexer für API & Download Statistiken.
      </p>

      {adding && (
        <div className="p-4 rounded-lg border border-white/[0.06] bg-card backdrop-blur-xl mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs text-muted mb-1 block">Name</label>
              <input
                className={inputClass}
                placeholder="SceneNZBs"
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
              {saving ? "..." : "Hinzufügen"}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-background transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {indexers.map((indexer, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-accent-amber/10 flex items-center justify-center">
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
          <div className="text-center py-6 text-sm text-muted">
            Noch keine Indexer konfiguriert.
          </div>
        )}
      </div>
    </Card>
  );
}

// --- OpenClaw Settings ---

function OpenClawSettings() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [url, setUrl] = useState("");
  const [password, setPassword] = useState("");
  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{
    online: boolean;
    models?: string[];
  } | null>(null);
  const [diagLogs, setDiagLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/config");
    const data = await res.json();
    setConfig(data);
    const oc = data.openclaw;
    if (oc) {
      setUrl(oc.url || "");
      setPassword(oc.password || "");
      setModel(oc.model || "");
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const checkStatus = useCallback(async () => {
    setTesting(true);
    setShowLogs(true);
    try {
      const res = await fetch("/api/chat/status");
      const data = await res.json();
      if (data.configured) {
        setStatus({ online: data.online, models: data.models });
      }
      if (data.logs) {
        setDiagLogs(data.logs);
      }
    } catch (err) {
      setStatus({ online: false });
      setDiagLogs([`Fehler: ${err instanceof Error ? err.message : "Unbekannt"}`]);
    } finally {
      setTesting(false);
    }
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const newConfig = {
        ...config,
        openclaw: {
          url: url.replace(/\/$/, ""),
          authMethod: password ? "password" as const : "none" as const,
          ...(password ? { password } : {}),
          ...(model ? { model } : {}),
        },
      };
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
      setConfig(newConfig as AppConfig);
      setTimeout(checkStatus, 500);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!config || !confirm("OpenClaw Verbindung wirklich entfernen?")) return;
    setSaving(true);
    try {
      const newConfig = { ...config };
      delete newConfig.openclaw;
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
      setConfig(newConfig as AppConfig);
      setUrl("");
      setPassword("");
      setModel("");
      setStatus(null);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)] transition-all duration-200";

  return (
    <Card>
      <CardHeader>
        <CardTitle>OpenClaw Gateway</CardTitle>
        <MessageSquare size={16} className="text-accent-purple" />
      </CardHeader>

      <p className="text-xs text-muted mb-4">
        Verbinde deinen{" "}
        <a
          href="https://docs.openclaw.ai/gateway"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-cyan hover:underline"
        >
          OpenClaw Gateway
        </a>{" "}
        für den integrierten AI Chat. Standard-Port: 18789.
      </p>

      {/* Connected status */}
      {status?.online && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-accent-emerald/5 border border-accent-emerald/20 mb-4">
          <div className="flex items-center gap-3">
            <StatusDot status="online" />
            <div>
              <span className="font-medium text-sm">Gateway verbunden</span>
              {status.models && status.models.length > 0 && (
                <span className="text-xs text-muted ml-2">
                  {status.models.length} Modell{status.models.length !== 1 ? "e" : ""}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-accent-red hover:bg-accent-red/10 transition-colors"
          >
            <LogOut size={14} />
            Trennen
          </button>
        </div>
      )}

      {/* URL */}
      <div className="mb-3">
        <label className="text-xs text-muted mb-1 block">Gateway URL</label>
        <input
          className={inputClass}
          placeholder="http://192.168.1.100:18789"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setStatus(null); }}
        />
        <p className="text-xs text-muted/50 mt-1">
          z.B. <code className="text-accent-cyan/70">http://192.168.1.100:18789</code> oder{" "}
          <code className="text-accent-cyan/70">http://localhost:18789</code>
        </p>
      </div>

      {/* Password */}
      <div className="mb-3">
        <label className="text-xs text-muted mb-1 block">
          Gateway Passwort{" "}
          <span className="text-muted/50">(falls konfiguriert)</span>
        </label>
        <input
          className={inputClass}
          type="password"
          placeholder="Leer lassen falls keine Auth"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {/* Model */}
      <div className="mb-4">
        <label className="text-xs text-muted mb-1 block">
          Modell{" "}
          <span className="text-muted/50">(optional)</span>
        </label>
        <input
          className={inputClass}
          placeholder="openclaw (Standard)"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
        <p className="text-xs text-muted/50 mt-1">
          Standard: <code className="text-accent-cyan/70">openclaw</code> &mdash; oder{" "}
          <code className="text-accent-cyan/70">openclaw:agentName</code> f&uuml;r einen bestimmten Agenten
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !url}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-cyan text-background text-sm font-medium hover:bg-accent-cyan/90 transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? "Speichern..." : "Speichern"}
        </button>
        <button
          onClick={checkStatus}
          disabled={testing || !url}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/[0.08] text-sm font-medium hover:bg-white/[0.04] transition-colors disabled:opacity-50"
        >
          {testing ? <Spinner /> : <MessageSquare size={14} />}
          {testing ? "Teste..." : "Verbindung testen"}
        </button>
      </div>

      {/* Status feedback */}
      {url && status && !status.online && !testing && (
        <p className="text-xs text-accent-red mt-3">
          Gateway nicht erreichbar. Klicke &quot;Verbindung testen&quot; f&uuml;r Details.
        </p>
      )}

      {/* Diagnostic Logs */}
      {showLogs && diagLogs.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted">Verbindungs-Log</span>
            <button
              onClick={() => { setShowLogs(false); setDiagLogs([]); }}
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              Schlie&szlig;en
            </button>
          </div>
          <div className="rounded-lg bg-black/40 border border-white/[0.06] p-3 max-h-48 overflow-y-auto font-mono text-xs space-y-0.5">
            {diagLogs.map((line, i) => (
              <div
                key={i}
                className={
                  line.includes("erfolgreich") || line.includes("Verbindung erfolgreich")
                    ? "text-accent-emerald"
                    : line.includes("Fehler") || line.includes("fehlgeschlagen")
                    ? "text-accent-red"
                    : line.includes("Teste:")
                    ? "text-accent-cyan"
                    : "text-muted"
                }
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
