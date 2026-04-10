"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HardDrive, Plus, RefreshCw, Save, Trash2, Waypoints, X } from "lucide-react";
import { RcloneStatusBadge } from "@/components/rclone/RcloneStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import type { AppConfig, ServerConfig } from "@/types/server";
import type {
  RcloneMountConfig,
  RcloneMountStatus,
  RcloneProfileConfig,
  RcloneProfileStatus,
} from "@/types/rclone";

const inputClass =
  "w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm transition-all duration-200 focus:border-accent-cyan/50 focus:shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)] focus:outline-none";

const emptyProfile: RcloneProfileConfig = {
  id: "",
  name: "",
  serverId: "",
  enabled: true,
  rcPort: 5572,
  mounts: [],
};

function normalizeMountPath(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return trimmed || "/";
  }

  return trimmed.replace(/\/+$/, "");
}

function createMount(): RcloneMountConfig {
  return {
    id: crypto.randomUUID(),
    label: "",
    path: "",
    mode: "unknown",
  };
}

function createMountFromStatus(mount: RcloneMountStatus): RcloneMountConfig {
  return {
    id: crypto.randomUUID(),
    label: mount.label,
    path: mount.path,
    remoteName: mount.remoteName,
    mode: mount.mode || "unknown",
  };
}

export function RcloneSettings() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [profiles, setProfiles] = useState<RcloneProfileConfig[]>([]);
  const [statuses, setStatuses] = useState<Record<string, RcloneProfileStatus>>({});
  const [discoveredMounts, setDiscoveredMounts] = useState<
    Record<string, RcloneMountStatus[]>
  >({});
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

  const loadMounts = useCallback(async () => {
    try {
      const response = await fetch("/api/rclone/mounts");
      if (!response.ok) {
        setDiscoveredMounts({});
        return;
      }

      const data = await response.json();
      const grouped = (data.mounts || []).reduce(
        (acc: Record<string, RcloneMountStatus[]>, mount: RcloneMountStatus) => {
          if (mount.source !== "discovered") {
            return acc;
          }

          acc[mount.profileId] = [...(acc[mount.profileId] || []), mount];
          return acc;
        },
        {}
      );
      setDiscoveredMounts(grouped);
    } catch {
      setDiscoveredMounts({});
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadConfig(), loadStatuses(), loadMounts()]);
  }, [loadConfig, loadMounts, loadStatuses]);

  const serverMap = useMemo(
    () => new Map((config?.servers || []).map((server: ServerConfig) => [server.id, server])),
    [config]
  );

  async function refreshRcloneViews() {
    await Promise.all([loadStatuses(), loadMounts()]);
  }

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
      await refreshRcloneViews();
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
          path: normalizeMountPath(mount.path),
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
      await refreshRcloneViews();
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
          className="flex items-center gap-1.5 rounded-lg bg-accent-cyan/10 px-3 py-1.5 text-sm font-medium text-accent-cyan transition-colors hover:bg-accent-cyan/20"
        >
          <Plus size={14} />
          Profil hinzufuegen
        </button>
      </CardHeader>

      <p className="mb-4 text-xs text-muted">
        Rclone-Profile haengen an vorhandenen SSH-Servern und sammeln RC-Status,
        Transferdaten sowie automatisch erkannte Mounts.
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
          discoveredMounts={[]}
        />
      )}

      <div className="space-y-3">
        {profiles.map((profile) => {
          const detectedMounts = discoveredMounts[profile.id] || [];

          if (editingId === profile.id) {
            return (
              <RcloneProfileForm
                key={profile.id}
                profile={profile}
                servers={config.servers || []}
                onCancel={() => setEditingId(null)}
                onSave={handleSaveProfile}
                saving={saving}
                discoveredMounts={detectedMounts}
              />
            );
          }

          return (
            <div
              key={profile.id}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{profile.name}</span>
                    <Badge variant={profile.enabled ? "success" : "default"}>
                      {profile.enabled ? "Aktiv" : "Deaktiviert"}
                    </Badge>
                    {statuses[profile.id] && (
                      <RcloneStatusBadge status={statuses[profile.id].status} />
                    )}
                  </div>
                  <div className="mt-1 space-y-1 text-xs text-muted">
                    <div>
                      Server: {serverMap.get(profile.serverId)?.name || profile.serverId || "-"}
                    </div>
                    <div>
                      RC:{" "}
                      {profile.rcUrl ||
                        `http://${serverMap.get(profile.serverId)?.host || "server"}:${profile.rcPort || 5572}`}
                    </div>
                    <div>
                      {profile.mounts.length} manuell, {detectedMounts.length} automatisch gefunden
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {profile.mounts.map((mount) => (
                    <div
                      key={mount.id}
                      className="rounded-lg border border-white/[0.04] bg-black/10 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <HardDrive size={14} className="text-accent-cyan" />
                        {mount.label}
                      </div>
                      <div className="mt-1 text-xs font-mono text-muted">{mount.path}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

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
  discoveredMounts,
}: {
  profile?: RcloneProfileConfig;
  servers: ServerConfig[];
  onSave: (profile: RcloneProfileConfig) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  discoveredMounts: RcloneMountStatus[];
}) {
  const [form, setForm] = useState<RcloneProfileConfig>(profile || { ...emptyProfile, mounts: [] });

  const availableDiscoveredMounts = useMemo(() => {
    const existingPaths = new Set(form.mounts.map((mount) => normalizeMountPath(mount.path)));
    return discoveredMounts.filter(
      (mount) => !existingPaths.has(normalizeMountPath(mount.path))
    );
  }, [discoveredMounts, form.mounts]);

  function updateMount(mountId: string, patch: Partial<RcloneMountConfig>) {
    setForm((current) => ({
      ...current,
      mounts: current.mounts.map((mount) =>
        mount.id === mountId ? { ...mount, ...patch } : mount
      ),
    }));
  }

  function adoptDiscoveredMount(mount: RcloneMountStatus) {
    setForm((current) => ({
      ...current,
      mounts: [...current.mounts, createMountFromStatus(mount)],
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
      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-muted">Name</label>
          <input
            className={inputClass}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Media Sync"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Server</label>
          <select
            className={inputClass}
            value={form.serverId}
            onChange={(event) => setForm({ ...form, serverId: event.target.value })}
            required
          >
            <option value="">Server auswaehlen</option>
            {servers.map((server) => (
              <option key={server.id} value={server.id}>
                {server.name} ({server.host})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">RC URL (optional)</label>
          <input
            className={inputClass}
            value={form.rcUrl || ""}
            onChange={(event) => setForm({ ...form, rcUrl: event.target.value })}
            placeholder="http://192.168.1.20:5572"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">RC Port</label>
          <input
            className={inputClass}
            type="number"
            value={form.rcPort || 5572}
            onChange={(event) => setForm({ ...form, rcPort: Number(event.target.value) || 5572 })}
            disabled={Boolean(form.rcUrl)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Benutzername</label>
          <input
            className={inputClass}
            value={form.username || ""}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
            placeholder="optional"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Passwort</label>
          <input
            className={inputClass}
            type="password"
            value={form.password || ""}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            placeholder="optional"
          />
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
          />
          Profil aktiv
        </label>
      </div>

      <div className="mb-4 rounded-lg border border-white/[0.06] bg-black/10 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Waypoints size={15} className="text-accent-cyan" />
            <span className="text-sm font-medium">Manuelle Mounts</span>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, mounts: [...form.mounts, createMount()] })}
            className="text-xs text-accent-cyan hover:underline"
          >
            + Mount hinzufuegen
          </button>
        </div>

        <div className="space-y-3">
          {form.mounts.map((mount) => (
            <div key={mount.id} className="grid grid-cols-1 gap-3 md:grid-cols-4">
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
              Noch keine manuellen Mount-Pfade hinterlegt. Ohne Eintraege arbeitet das Profil
              nur mit automatisch erkannten Mounts.
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-white/[0.06] bg-black/10 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive size={15} className="text-accent-cyan" />
            <span className="text-sm font-medium">Gefundene Mounts</span>
          </div>
          <Badge variant="default">{availableDiscoveredMounts.length}</Badge>
        </div>

        <p className="mb-3 text-xs text-muted">
          Nach einem Verbindungstest erscheinen hier automatisch erkannte Mounts aus RC und SSH.
          Du kannst sie mit einem Klick in die manuelle Profilkonfiguration uebernehmen.
        </p>

        <div className="space-y-3">
          {availableDiscoveredMounts.map((mount) => (
            <div
              key={`${mount.profileId}-${mount.mountId}`}
              className="flex flex-col gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{mount.label}</span>
                  <Badge variant="info">Gefunden</Badge>
                  {mount.discoveredBy && (
                    <Badge variant="default">{mount.discoveredBy.toUpperCase()}</Badge>
                  )}
                  <RcloneStatusBadge status={mount.status} />
                </div>
                <div className="mt-1 text-xs font-mono text-muted">{mount.path}</div>
                {mount.remoteName && (
                  <div className="mt-1 text-xs text-muted">Remote: {mount.remoteName}</div>
                )}
              </div>

              <button
                type="button"
                onClick={() => adoptDiscoveredMount(mount)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-accent-cyan/30 px-3 py-2 text-xs font-medium text-accent-cyan hover:bg-accent-cyan/10"
              >
                <Plus size={13} />
                Uebernehmen
              </button>
            </div>
          ))}

          {availableDiscoveredMounts.length === 0 && (
            <div className="text-xs text-muted">
              {profile
                ? "Noch keine neuen Mounts gefunden. Starte einen Verbindungstest, um Discovery-Daten zu laden."
                : "Discovery-Daten werden verfuegbar, sobald das Profil gespeichert und getestet wurde."}
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
