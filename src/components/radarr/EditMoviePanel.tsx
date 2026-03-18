"use client";

import { useState, useEffect } from "react";
import { Save, X, Pencil } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useRadarrProfiles, useRadarrRootFolders } from "@/hooks/useRadarr";
import type { RadarrMovie } from "@/types/radarr";

const inputClass =
  "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)] transition-all duration-200";

interface EditMoviePanelProps {
  movie: RadarrMovie;
  onSaved: () => void;
}

export function EditMoviePanel({ movie, onSaved }: EditMoviePanelProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: profiles } = useRadarrProfiles();
  const { data: rootFolders } = useRadarrRootFolders();

  const [form, setForm] = useState({
    monitored: movie.monitored,
    qualityProfileId: movie.qualityProfileId,
    minimumAvailability: movie.minimumAvailability,
    path: movie.path,
    tags: movie.tags,
  });

  useEffect(() => {
    setForm({
      monitored: movie.monitored,
      qualityProfileId: movie.qualityProfileId,
      minimumAvailability: movie.minimumAvailability,
      path: movie.path,
      tags: movie.tags,
    });
  }, [movie]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/radarr/movies/${movie.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...movie, ...form }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Fehler ${res.status}`);
      }
      onSaved();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg hover:bg-accent-cyan/20 text-accent-cyan transition-colors"
        title="Bearbeiten"
      >
        <Pencil size={16} />
      </button>
    );
  }

  return (
    <Card glow="cyan" className="mt-4">
      <CardHeader>
        <CardTitle>Film bearbeiten</CardTitle>
        <button
          onClick={() => setOpen(false)}
          className="p-1 rounded hover:bg-white/[0.06] text-muted transition-colors"
        >
          <X size={16} />
        </button>
      </CardHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Monitored */}
        <div>
          <label className="text-xs text-muted mb-1.5 block">Überwachung</label>
          <select
            className={inputClass}
            value={form.monitored ? "true" : "false"}
            onChange={(e) =>
              setForm({ ...form, monitored: e.target.value === "true" })
            }
          >
            <option value="true">Überwacht</option>
            <option value="false">Nicht überwacht</option>
          </select>
        </div>

        {/* Quality Profile */}
        <div>
          <label className="text-xs text-muted mb-1.5 block">
            Qualitätsprofil
          </label>
          {profiles ? (
            <select
              className={inputClass}
              value={form.qualityProfileId}
              onChange={(e) =>
                setForm({
                  ...form,
                  qualityProfileId: parseInt(e.target.value),
                })
              }
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2 h-[38px]">
              <Spinner className="h-4 w-4" />
              <span className="text-xs text-muted">Lade Profile...</span>
            </div>
          )}
        </div>

        {/* Minimum Availability */}
        <div>
          <label className="text-xs text-muted mb-1.5 block">
            Mindestverfügbarkeit
          </label>
          <select
            className={inputClass}
            value={form.minimumAvailability}
            onChange={(e) =>
              setForm({ ...form, minimumAvailability: e.target.value })
            }
          >
            <option value="announced">Angekündigt</option>
            <option value="inCinemas">Im Kino</option>
            <option value="released">Veröffentlicht</option>
            <option value="preDB">PreDB</option>
          </select>
        </div>

        {/* Path */}
        <div>
          <label className="text-xs text-muted mb-1.5 block">Pfad</label>
          <input
            className={inputClass}
            value={form.path}
            onChange={(e) => setForm({ ...form, path: e.target.value })}
          />
        </div>

        {/* Root Folder Info */}
        {rootFolders && rootFolders.length > 0 && (
          <div className="md:col-span-2">
            <label className="text-xs text-muted mb-1.5 block">
              Verfügbare Stammordner
            </label>
            <div className="flex flex-wrap gap-2">
              {rootFolders.map((rf) => (
                <button
                  key={rf.id}
                  type="button"
                  onClick={() => {
                    const movieFolder = movie.path.split("/").pop() || movie.title;
                    setForm({
                      ...form,
                      path: `${rf.path.replace(/\/$/, "")}/${movieFolder}`,
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-muted hover:text-foreground transition-all"
                >
                  {rf.path}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-accent-red/10 text-accent-red text-sm mb-4">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-cyan text-background text-sm font-medium hover:bg-accent-cyan/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Spinner className="h-3.5 w-3.5" />
          ) : (
            <Save size={14} />
          )}
          {saving ? "Speichern..." : "Speichern"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-lg border border-white/[0.08] text-sm hover:bg-white/[0.04] transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </Card>
  );
}
