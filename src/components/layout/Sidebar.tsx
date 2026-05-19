"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Server,
  Container,
  Tv,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Box,
  Image as ImageIcon,
  Layers,
  Settings,
  Film,
  Clapperboard,
  Download,
  Calendar,
  Library,
  Globe,
  Bot,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: { label: string; href: string; icon: React.ReactNode }[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Server",
    href: "/servers",
    icon: <Server size={20} />,
  },
  {
    label: "Docker",
    href: "/docker",
    icon: <Container size={20} />,
    children: [
      { label: "Container", href: "/docker/containers", icon: <Box size={16} /> },
      { label: "Images", href: "/docker/images", icon: <ImageIcon size={16} /> },
      { label: "Stacks", href: "/docker/stacks", icon: <Layers size={16} /> },
    ],
  },
  {
    label: "Radarr",
    href: "/radarr",
    icon: <Film size={20} />,
    children: [
      { label: "Filme", href: "/radarr/movies", icon: <Library size={16} /> },
      { label: "Queue", href: "/radarr/queue", icon: <Download size={16} /> },
      { label: "Kalender", href: "/radarr/calendar", icon: <Calendar size={16} /> },
    ],
  },
  {
    label: "Sonarr",
    href: "/sonarr",
    icon: <Clapperboard size={20} />,
    children: [
      { label: "Serien", href: "/sonarr/series", icon: <Library size={16} /> },
      { label: "Queue", href: "/sonarr/queue", icon: <Download size={16} /> },
      { label: "Kalender", href: "/sonarr/calendar", icon: <Calendar size={16} /> },
    ],
  },
  {
    label: "Plex",
    href: "/plex",
    icon: <Tv size={20} />,
  },
  {
    label: "Indexer",
    href: "/indexer",
    icon: <Database size={20} />,
  },
  {
    label: "DNS",
    href: "/dns",
    icon: <Globe size={20} />,
  },
  {
    label: "OpenClaw",
    href: "/chat",
    icon: <Bot size={20} />,
  },
  {
    label: "Einstellungen",
    href: "/settings",
    icon: <Settings size={20} />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <button
        className="fixed left-3 z-50 rounded-md border border-border bg-card-solid p-2.5 text-muted lg:hidden"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menue oeffnen"
      >
        <LayoutDashboard size={20} />
      </button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col transition-all duration-150",
          "border-r border-border bg-card-solid",
          collapsed ? "w-16" : "w-56",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-border bg-card-hover">
            <Server size={18} className="text-accent-cyan" />
          </div>
          {!collapsed && (
            <span className="text-base font-semibold tracking-tight text-foreground">
              Servr
            </span>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                    isActive
                      ? "bg-card-hover text-foreground"
                      : "text-muted hover:bg-card-hover hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <div className="absolute bottom-2 left-0 top-2 w-0.5 rounded-r-sm bg-accent-cyan" />
                  )}
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </Link>

                {!collapsed && item.children && isActive && (
                  <div className="ml-5 mt-1 space-y-1 border-l border-border pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors duration-150",
                          pathname === child.href
                            ? "bg-card-hover text-foreground"
                            : "text-muted hover:bg-card-hover hover:text-foreground"
                        )}
                      >
                        {child.icon}
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden h-12 items-center justify-center border-t border-border text-muted transition-colors hover:bg-card-hover hover:text-foreground lg:flex"
          aria-label={collapsed ? "Sidebar erweitern" : "Sidebar einklappen"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>
    </>
  );
}
