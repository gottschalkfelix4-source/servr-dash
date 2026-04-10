"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HardDrive, Plus, RefreshCw, Save, Trash2, Waypoints, X } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { RcloneStatusBadge } from "@/components/rclone/RcloneStatusBadge";
import type { AppConfig, ServerConfig } from "@/types/server";
import type { RcloneMountConfig, RcloneProfileConfig, RcloneProfileStatus } from "@/types/rclone";

const inputClass =
  "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)] transition-all duration-200";

const emptyProfile: RcloneProfileConfig = {
  id: "",
  name: "",
  serverId: "",
  enabled: true,
  rcPort: 5572,
  mounts: [],
};

function createMount(): RcloneMountConfig {
  return {
    id: crypto.randomUUID(),
    label: "",
    path: "",
    mode: "unknown",
  };
}

export function RcloneSettings() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [profiles, setProfiles] = useState<RcloneProfileConfig[]>([]);
  const [statuses, setStatuses] = useState<Record<string, RcloneProfileStatus>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    const response = await fetch("/api/config");
    const data = await response.json();
    setConfig(data);
    setProfiles(data.rclone?.profiles || []);
  }, []);

  const loadStatuses = useCallback(async () => {
    try {
      const response = await fetch("/api/rclone/profiles");
      if (!response.ok) {
        setStatuses({});
        return;
      }
      const data = await response.json();
      const mapped = Object.fromEntries(
        (data.profiles || []).map((profile: RcloneProfileStatus) => [profile.id, profile])
      );
      setStatuses(mapped);
    } catch {
      setStatuses({});
    }
  }, []);

  useEffect(() => {
    void loadConfig();
    void loadStatuses();
  }, [loadConfig, loadStatuses]);

  const serverMap = useMemo(
    () => new Map((config?.servers || []).map((server: ServerConfig) => [server.id, server])),
    [config]
  );

  async function saveProfiles(nextProfiles: RcloneProfileConfig[]) {
    if (!config) return;
    setSaving(true);
    try {
      const nextConfig = {
        ...config,
        rclone: {
          profiles: nextProfiles,
        },
      };
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextConfig),
      });
      setConfig(nextConfig);
      setProfiles(nextProfiles);
      await loadStatuses();
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfile(profile: RcloneProfileConfig) {
    const normalizedProfile: RcloneProfileConfig = {
      ...profile,
      id: profile.id || profile.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      rcUrl: profile.rcUrl?.trim() || undefined,
      rcPort: profile.rcUrl ? undefined : profile.rcPort || 5572,
      username: profile.username?.trim() || undefined,
      password: profile.password?.trim() || undefined,
      label: profile.label?.trim() || undefined,
      mounts: profile.mounts
        .filter((mount) => mount.label.trim() && mount.path.trim())
        .map((mount) => ({
          ...mount,
          id: mount.id || crypto.randomUUID(),
          label: mount.label.trim(),
          path: mount.path.trim(),
          remoteName: mount.remoteName?.trim() || undefined,
          mode: mount.mode || "unknown",
        })),
    };

    const exists = profiles.some((item) => item.id === normalizedProfile.id);
    const nextProfiles = exists
      ? profiles.map((item) => (item.id === normalizedProfile.id ? normalizedProfile : item))
      : [...profiles, normalizedProfile];

    await saveProfiles(nextProfiles);
    setEditingId(null);
    setAdding(false);
  }

  async function handleDeleteProfile(profileId: string) {
    if (!confirm("Rclone-Profil wirklich entfernen?")) return;
    await saveProfiles(profiles.filter((profile) => profile.id !== profileId));
  }

  async function handleTestProfile(profileId: string) {
    setTestingId(profileId);
    try {
      await fetch("/api/rclone/recheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      await loadStatuses();
    } finally {
      setTestingId(null);
    }
  }

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
        <CardTitle>Rclone</CardTitle>
        <button
          onClick={() => {
            setAdding(true);
            setEditingId(null);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan/10 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
        >
          <Plus size={14} />
          Profil hinzufügen
        </button>
      </CardHeader>

      <p className="text-xs text-muted mb-4">
        Rclone-Profile hängen an vorhandenen SSH-Servern und sammeln RC-Status, Mount-Checks und Transferdaten.
      </p>

      {(config.servers || []).length === 0 && (
        <div className="mb-4 rounded-lg border border-accent-amber/20 bg-accent-amber/10 p-3 text-sm text-accent-amber">
          Lege zuerst mindestens einen SSH-Server an, bevor du Rclone-Profile verbindest.
        </div>
      )}

      {adding && (
        <RcloneProfileForm
          servers={config.servers || []}
          onCancel={() => setAdding(false)}
          onSave={handleSaveProfile}
          saving={saving}
        />
      )}

      <div className="space-y-3">
        {profiles.map((profile) =>
          editingId === profile.id ? (
            <RcloneProfileForm
              key={profile.id}
              profile={profile}
              servers={config.servers || []}
              onCancel={() => setEditingId(null)}
              onSave={handleSaveProfile}
              saving={saving}
            />
          ) : (
            <div
              key={profile.id}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{profile.name}</span>
                    <Badge variant={profile.enabled ? "success" : "default"}>
                      {profile.enabled ? "Aktiv" : "Deaktiviert"}
                    </Badge>
                    {statuses[profile.id] && (
                      <RcloneStatusBadge status={statuses[profile.id].status} />
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted space-y-1">
                    <div>
                      Server: {serverMap.get(profile.serverId)?.name || profile.serverId || "—"}
                    </div>
                    <div>
                      RC: {profile.rcUrl || `http://${serverMap.get(profile.serverId)?.host || "server"}:${profile.rcPort || 5572}`}
                    </div>
                    <div>{profile.mounts.length} Mounts hinterlegt</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleTestProfile(profile.id)}
                    disabled={testingId === profile.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-muted hover:bg-white/[0.04] hover:text-foreground disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={testingId === profile.id ? "animate-spin" : ""} />
                    Verbindung testen
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(profile.id);
                      setAdding(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-muted hover:bg-white/[0.04] hover:text-foreground"
                  >
                    <Save size={13} />
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(profile.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-accent-red/20 px-3 py-2 text-xs text-accent-red hover:bg-accent-red/10"
                  >
                    <Trash2 size={13} />
                    Entfernen
                  </button>
                </div>
              </div>

              {profile.mounts.length > 0 && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {profile.mounts.map((mount) => (
                    <div
                      key={mount.id}
                      className="rounded-lg border border-white/[0.04] bg-black/10 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <HardDrive size={14} className="text-accent-cyan" />
                        {mount.label}
                      </div>
                      <div className="text-xs text-muted mt-1 font-mono">{mount.path}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {profiles.length === 0 && !adding && (
          <div className="py-8 text-center text-sm text-muted">
            Noch keine Rclone-Profile konfiguriert.
          </div>
        )}
      </div>
    </Card>
  );
}

function RcloneProfileForm({
  profile,
  servers,
  onSave,
  onCancel,
  saving,
}: {
  profile?: RcloneProfileConfig;
  servers: ServerConfig[];
  onSave: (profile: RcloneProfileConfig) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<RcloneProfileConfig>(
    profile || { ...emptyProfile, mounts: [] }
  );

  function updateMount(mountId: string, patch: Partial<RcloneMountConfig>) {
    setForm((current) => ({
      ...current,
      mounts: current.mounts.map((mount) =>
        mount.id === mountId ? { ...mount, ...patch } : mount
      ),
    }));
  }

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        await onSave(form);
      }}
      className="rounded-lg border border-white/[0.06] bg-card p-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-muted mb-1 block">Name</label>
          <input
            className={inputClass}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Media Sync"
            required
          />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Server</label>
          <select
            className={inputClass}
            value={form.serverId}
            onChange={(event) => setForm({ ...form, serverId: event.target.value })}
            required
          >
            <option value="">Server auswählen</option>
            {servers.map((server) => (
              <option key={server.id} value={server.id}>
                {server.name} ({server.host})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">RC URL (optional)</label>
          <input
            className={inputClass}
            value={form.rcUrl || ""}
            onChange={(event) => setForm({ ...form, rcUrl: event.target.value })}
            placeholder="http://192.168.1.20:5572"
          />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">RC Port</label>
          <input
            className={inputClass}
            type="number"
            value={form.rcPort || 5572}
            onChange={(event) =>
              setForm({ ...form, rcPort: Number(event.target.value) || 5572 })
            }
            disabled={Boolean(form.rcUrl)}
          />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Benutzername</label>
          <input
            className={inputClass}
            value={form.username || ""}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
            placeholder="optional"
          />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Passwort</label>
          <input
            className={inputClass}
            type="password"
            value={form.password || ""}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            placeholder="optional"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
          />
          Profil aktiv
        </label>
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-black/10 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Waypoints size={15} className="text-accent-cyan" />
            <span className="text-sm font-medium">Erwartete Mounts</span>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, mounts: [...form.mounts, createMount()] })}
            className="text-xs text-accent-cyan hover:underline"
          >
            + Mount hinzufügen
          </button>
        </div>

        <div className="space-y-3">
          {form.mounts.map((mount) => (
            <div key={mount.id} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                className={inputClass}
                value={mount.label}
                onChange={(event) => updateMount(mount.id, { label: event.target.value })}
                placeholder="Label"
              />
              <input
                className={inputClass}
                value={mount.path}
                onChange={(event) => updateMount(mount.id, { path: event.target.value })}
                placeholder="/mnt/media"
              />
              <input
                className={inputClass}
                value={mount.remoteName || ""}
                onChange={(event) => updateMount(mount.id, { remoteName: event.target.value })}
                placeholder="remote:path"
              />
              <div className="flex gap-2">
                <select
                  className={inputClass}
                  value={mount.mode || "unknown"}
                  onChange={(event) =>
                    updateMount(mount.id, {
                      mode: event.target.value as RcloneMountConfig["mode"],
                    })
                  }
                >
                  <option value="unknown">Modus unbekannt</option>
                  <option value="rw">Read/Write</option>
                  <option value="ro">Read only</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      mounts: form.mounts.filter((item) => item.id !== mount.id),
                    })
                  }
                  className="inline-flex items-center justify-center rounded-lg border border-accent-red/20 px-3 text-accent-red hover:bg-accent-red/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {form.mounts.length === 0 && (
            <div className="text-xs text-muted">
              Noch keine Mount-Pfade hinterlegt. Ohne Mounts bleibt das Profil ein reines RC-Monitoring.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving || !form.name || !form.serverId}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-cyan px-4 py-2 text-sm font-medium text-background hover:bg-accent-cyan/90 disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? "Speichern..." : "Speichern"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-4 py-2 text-sm hover:bg-white/[0.04]"
        >
          <X size={14} />
          Abbrechen
        </button>
      </div>
    </form>
  );
}
