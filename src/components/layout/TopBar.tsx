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
  "/indexer": "Indexer",
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
    <header className="flex h-14 items-center justify-between border-b border-border bg-card-solid px-3 pt-[env(safe-area-inset-top,0px)] sm:h-16 sm:px-6 lg:pt-0">
      <div className="flex items-center gap-3 pl-12 lg:pl-0">
        <h1 className="text-base sm:text-lg font-semibold truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Activity size={14} className="text-accent-emerald" />
          <span>Live</span>
        </div>
        {user && (
          <div className="flex items-center gap-2 border-l border-border pl-3">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <User size={13} />
              <span>{user.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md p-1.5 text-muted transition-colors hover:bg-card-hover hover:text-accent-red"
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
