import { Card } from "@/components/ui/Card";
import { Film, Tv, Music, Image as ImageIcon } from "lucide-react";
import type { PlexLibrary } from "@/types/plex";

interface LibraryOverviewProps {
  libraries: PlexLibrary[];
}

const typeConfig: Record<string, { icon: React.ReactNode }> = {
  movie: {
    icon: <Film size={24} className="text-accent-cyan" />,
  },
  show: {
    icon: <Tv size={24} className="text-accent-purple" />,
  },
  artist: {
    icon: <Music size={24} className="text-accent-amber" />,
  },
  photo: {
    icon: <ImageIcon size={24} className="text-accent-emerald" />,
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
          <Card key={lib.key} hover>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-card-solid">
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
