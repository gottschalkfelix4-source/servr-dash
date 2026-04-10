"use client";

import { useMemo, useState } from "react";
import { Activity, ArrowRightLeft, HardDrive, RefreshCw, Waypoints } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { RcloneThroughputChart } from "@/components/rclone/RcloneThroughputChart";
import { RcloneActivityChart } from "@/components/rclone/RcloneActivityChart";
import { RcloneProfileCard } from "@/components/rclone/RcloneProfileCard";
import { RcloneTransfersPanel } from "@/components/rclone/RcloneTransfersPanel";
import {
  useRcloneHistory,
  useRcloneOverview,
  useRcloneProfiles,
  useRcloneTransfers,
} from "@/hooks/useRclone";
import { formatBytes } from "@/lib/utils";
import type { RcloneProfileStatus } from "@/types/rclone";

const EMPTY_PROFILES: RcloneProfileStatus[] = [];

export default function RcloneOverviewPage() {
  const { data: overviewData, mutate: mutateOverview } = useRcloneOverview();
  const { data: profileData, mutate: mutateProfiles } = useRcloneProfiles();
  const { data: transferData, mutate: mutateTransfers } = useRcloneTransfers();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const profiles = profileData?.profiles ?? EMPTY_PROFILES;
  const overview = overviewData?.overview;
  const activeProfileId = useMemo(() => {
    if (selectedProfileId && profiles.some((profile) => profile.id === selectedProfileId)) {
      return selectedProfileId;
    }
    return profiles[0]?.id;
  }, [profiles, selectedProfileId]);
  const { data: historyData, mutate: mutateHistory } = useRcloneHistory(activeProfileId);
  const history = historyData?.history || [];

  async function handleRecheck(profileId?: string) {
    setRefreshingId(profileId || "all");
    try {
      await fetch("/api/rclone/recheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileId ? { profileId } : {}),
      });
      await Promise.all([
        mutateOverview(),
        mutateProfiles(),
        mutateTransfers(),
        activeProfileId ? mutateHistory() : Promise.resolve(),
      ]);
    } finally {
      setRefreshingId(null);
    }
  }

  if (!overview) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div>
        <PageHeader
          title="Rclone"
          description="Noch keine Rclone-Profile konfiguriert"
        />
        <Card>
          <div className="py-10 text-center">
            <Waypoints size={36} className="mx-auto text-accent-cyan mb-3" />
            <h3 className="font-medium mb-2">Rclone ist noch nicht eingerichtet</h3>
            <p className="text-sm text-muted">
              Füge in den Einstellungen ein servergebundenes Rclone-Profil hinzu, um Live-Status,
              Mounts und Transfers zu sehen.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rclone"
        description="Live-Überblick über RC-Verbindungen, Mount-Gesundheit und Transfers"
        actions={
          <button
            onClick={() => handleRecheck()}
            disabled={refreshingId === "all"}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshingId === "all" ? "animate-spin" : ""} />
            Alles prüfen
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Profile online" value={`${overview.onlineProfiles}/${overview.profileCount}`} icon={<Waypoints size={16} className="text-accent-cyan" />} />
        <MetricCard label="Mounts gesund" value={`${overview.mountsHealthy}/${overview.mountsTotal}`} icon={<HardDrive size={16} className="text-accent-emerald" />} />
        <MetricCard label="Aktive Jobs" value={`${overview.activeTransfers}`} icon={<ArrowRightLeft size={16} className="text-accent-amber" />} />
        <MetricCard label="Durchsatz" value={`${formatBytes(overview.totalSpeed)}/s`} icon={<Activity size={16} className="text-accent-purple" />} />
      </div>

      {profiles.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {profiles.map((profile) => {
            const isActive = activeProfileId === profile.id;
            return (
              <button
                key={profile.id}
                onClick={() => setSelectedProfileId(profile.id)}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20"
                    : "border border-white/[0.08] text-muted hover:bg-white/[0.04] hover:text-foreground"
                }`}
              >
                {profile.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Durchsatzverlauf</CardTitle>
            <Badge variant="info">{activeProfileId || "—"}</Badge>
          </CardHeader>
          <RcloneThroughputChart data={history} />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Aktivität & Fehler</CardTitle>
            <Badge variant="default">Letzte Minute</Badge>
          </CardHeader>
          <RcloneActivityChart data={history} />
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <Badge variant="default">{profiles.length}</Badge>
          </CardHeader>
          <div className="grid grid-cols-1 gap-4">
            {profiles.map((profile) => (
              <RcloneProfileCard
                key={profile.id}
                profile={profile}
                onRecheck={handleRecheck}
                busy={refreshingId === profile.id}
              />
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zuletzt gesehen</CardTitle>
            <Badge variant="default">
              {(transferData?.active.length || 0) + (transferData?.recent.length || 0)}
            </Badge>
          </CardHeader>
          {transferData && transferData.active.length + transferData.recent.length > 0 ? (
            <RcloneTransfersPanel
              transfers={[...(transferData.active || []), ...(transferData.recent || []).slice(0, 5)]}
            />
          ) : (
            <div className="py-8 text-sm text-muted">Keine aktuellen oder kürzlich beendeten Transfers.</div>
          )}
        </Card>
      </div>

      {overview.lastErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Letzte Fehler</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {overview.lastErrors.map((error) => (
              <div
                key={error}
                className="rounded-lg border border-accent-red/15 bg-accent-red/8 px-3 py-2 text-sm text-accent-red"
              >
                {error}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-muted">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </Card>
  );
}
