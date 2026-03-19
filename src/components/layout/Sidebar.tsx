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
  Shield,
  Monitor,
  ListChecks,
  ScrollText,
  Globe,
  MessageSquare,
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
    label: "Backups",
    href: "/backups",
    icon: <Shield size={20} />,
    children: [
      { label: "Geräte", href: "/backups/devices", icon: <Monitor size={16} /> },
      { label: "Tasks", href: "/backups/tasks", icon: <ListChecks size={16} /> },
      { label: "Verlauf", href: "/backups/logs", icon: <ScrollText size={16} /> },
    ],
  },
  {
    label: "Plex",
    href: "/plex",
    icon: <Tv size={20} />,
  },
  {
    label: "DNS",
    href: "/dns",
    icon: <Globe size={20} />,
  },
  {
    label: "AI Chat",
    href: "/chat",
    icon: <MessageSquare size={20} />,
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
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile hamburger */}
      <button
        className="fixed top-3 left-3 z-50 lg:hidden rounded-lg glass p-2.5"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menü öffnen"
      >
        <LayoutDashboard size={20} />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300",
          "bg-card-solid/80 backdrop-blur-2xl border-r border-white/[0.06]",
          collapsed ? "w-16" : "w-56",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.06]">
          <div className="h-8 w-8 rounded-lg bg-accent-cyan/15 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_-2px_rgba(34,211,238,0.4)]">
            <Server size={18} className="text-accent-cyan" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Servr
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
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
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-accent-cyan/10 text-accent-cyan shadow-[0_0_20px_-8px_rgba(34,211,238,0.3)]"
                      : "text-muted hover:bg-white/[0.04] hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent-cyan shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                  )}
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </Link>

                {/* Sub-navigation */}
                {!collapsed && item.children && isActive && (
                  <div className="ml-5 mt-1 space-y-1 border-l border-accent-cyan/20 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200",
                          pathname === child.href
                            ? "text-accent-cyan bg-accent-cyan/5"
                            : "text-muted hover:text-foreground"
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

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-12 border-t border-white/[0.06] text-muted hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>
    </>
  );
}
