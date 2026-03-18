import { Card } from "@/components/ui/Card";
import { Film, Tv, Music, Image as ImageIcon } from "lucide-react";
import type { PlexLibrary } from "@/types/plex";

interface LibraryOverviewProps {
  libraries: PlexLibrary[];
}

const typeConfig: Record<string, { icon: React.ReactNode; glow: string }> = {
  movie: {
    icon: <Film size={24} className="text-accent-cyan" />,
    glow: "hover:shadow-[0_0_25px_-8px_rgba(34,211,238,0.3)]",
  },
  show: {
    icon: <Tv size={24} className="text-accent-purple" />,
    glow: "hover:shadow-[0_0_25px_-8px_rgba(167,139,250,0.3)]",
  },
  artist: {
    icon: <Music size={24} className="text-accent-amber" />,
    glow: "hover:shadow-[0_0_25px_-8px_rgba(245,158,11,0.3)]",
  },
  photo: {
    icon: <ImageIcon size={24} className="text-accent-emerald" />,
    glow: "hover:shadow-[0_0_25px_-8px_rgba(16,185,129,0.3)]",
  },
};

const typeLabels: Record<string, string> = {
  movie: "Filme",
  show: "Serien",
  artist: "Musik",
  photo: "Fotos",
};

export function LibraryOverview({ libraries }: LibraryOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {libraries.map((lib) => {
        const config = typeConfig[lib.type] || typeConfig.movie;
        return (
          <Card key={lib.key} hover className={config.glow}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-lg bg-white/[0.03] flex items-center justify-center">
                {config.icon}
              </div>
              <div>
                <div className="font-medium">{lib.title}</div>
                <div className="text-xs text-muted">
                  {typeLabels[lib.type] || lib.type}
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold">{lib.count.toLocaleString()}</div>
            <div className="text-xs text-muted">Einträge</div>
          </Card>
        );
      })}
    </div>
  );
}
