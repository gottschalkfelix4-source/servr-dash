"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Activity, LogOut, User } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/servers": "Server",
  "/docker": "Docker",
  "/docker/containers": "Container",
  "/docker/images": "Images",
  "/docker/stacks": "Stacks",
  "/radarr": "Radarr",
  "/radarr/movies": "Filme",
  "/radarr/movies/add": "Film hinzufügen",
  "/radarr/queue": "Download Queue",
  "/radarr/calendar": "Kalender",
  "/sonarr": "Sonarr",
  "/sonarr/series": "Serien",
  "/sonarr/series/add": "Serie hinzufügen",
  "/sonarr/queue": "Download Queue",
  "/sonarr/calendar": "Kalender",
  "/backups": "Backups",
  "/backups/devices": "Backup-Geräte",
  "/backups/tasks": "Backup-Tasks",
  "/backups/logs": "Backup-Verlauf",
  "/dns": "DNS Management",
  "/chat": "OpenClaw",
  "/plex": "Plex",
  "/plex/streams": "Active Streams",
  "/settings": "Einstellungen",
};

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const title = pageTitles[pathname] || "Servr Dash";
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setUser(d.user))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-14 sm:h-16 border-b border-white/[0.06] bg-card-solid/40 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6">
      <div className="flex items-center gap-3 pl-12 lg:pl-0">
        <h1 className="text-base sm:text-lg font-semibold truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <div className="relative">
            <Activity size={14} className="text-accent-emerald" />
            <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse-glow" />
          </div>
          <span>Live</span>
        </div>
        {user && (
          <div className="flex items-center gap-2 pl-3 border-l border-white/[0.06]">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <User size={13} />
              <span>{user.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-muted hover:text-accent-red hover:bg-accent-red/10 transition-all"
              title="Abmelden"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
