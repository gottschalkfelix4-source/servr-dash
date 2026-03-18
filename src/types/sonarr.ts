export interface SonarrSeries {
  id: number;
  title: string;
  sortTitle: string;
  year: number;
  tvdbId: number;
  imdbId?: string;
  overview?: string;
  runtime: number;
  genres: string[];
  network?: string;
  airTime?: string;
  status: string; // "continuing" | "ended" | "upcoming" | "deleted"
  seriesType: string; // "standard" | "daily" | "anime"
  path: string;
  qualityProfileId: number;
  monitored: boolean;
  seasonFolder: boolean;
  added: string;
  firstAired?: string;
  lastAired?: string;
  nextAiring?: string;
  previousAiring?: string;
  seasons: SonarrSeason[];
  images: SonarrImage[];
  statistics: SonarrSeriesStatistics;
  rootFolderPath?: string;
  tags: number[];
  ratings?: { votes: number; value: number };
  certification?: string;
}

export interface SonarrSeason {
  seasonNumber: number;
  monitored: boolean;
  statistics?: {
    episodeFileCount: number;
    episodeCount: number;
    totalEpisodeCount: number;
    sizeOnDisk: number;
    percentOfEpisodes: number;
  };
}

export interface SonarrSeriesStatistics {
  seasonCount: number;
  episodeFileCount: number;
  episodeCount: number;
  totalEpisodeCount: number;
  sizeOnDisk: number;
  percentOfEpisodes: number;
}

export interface SonarrEpisode {
  id: number;
  seriesId: number;
  tvdbId?: number;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  airDate?: string;
  airDateUtc?: string;
  overview?: string;
  hasFile: boolean;
  monitored: boolean;
  episodeFileId?: number;
  episodeFile?: SonarrEpisodeFile;
  absoluteEpisodeNumber?: number;
  unverifiedSceneNumbering?: boolean;
}

export interface SonarrEpisodeFile {
  id: number;
  relativePath: string;
  path: string;
  size: number;
  quality: { quality: { id: number; name: string; resolution: number } };
  mediaInfo?: {
    videoCodec?: string;
    audioCodec?: string;
    audioChannels?: number;
    resolution?: string;
  };
  dateAdded: string;
}

export interface SonarrImage {
  coverType: "poster" | "banner" | "fanart" | "screenshot" | "headshot";
  url: string;
  remoteUrl: string;
}

export interface SonarrQualityProfile {
  id: number;
  name: string;
  upgradeAllowed: boolean;
  cutoff: number;
}

export interface SonarrRootFolder {
  id: number;
  path: string;
  freeSpace: number;
  totalSpace?: number;
}

export interface SonarrQueueItem {
  id: number;
  seriesId: number;
  episodeId: number;
  title: string;
  status: string;
  trackedDownloadStatus?: string;
  trackedDownloadState?: string;
  size: number;
  sizeleft: number;
  timeleft?: string;
  estimatedCompletionTime?: string;
  quality: { quality: { name: string } };
  protocol: string;
  downloadClient?: string;
  indexer?: string;
  series?: { title: string };
  episode?: { title: string; seasonNumber: number; episodeNumber: number };
}

export interface SonarrHistoryRecord {
  id: number;
  seriesId: number;
  episodeId: number;
  sourceTitle: string;
  quality: { quality: { name: string } };
  date: string;
  eventType: string;
  data?: Record<string, string>;
  series?: { title: string };
  episode?: { title: string; seasonNumber: number; episodeNumber: number };
}

export interface SonarrCalendarItem {
  id: number;
  seriesId: number;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  airDate?: string;
  airDateUtc?: string;
  overview?: string;
  hasFile: boolean;
  monitored: boolean;
  series?: {
    title: string;
    images: SonarrImage[];
    network?: string;
  };
}

export interface SonarrStatus {
  version: string;
  appName: string;
  startupPath: string;
  osName?: string;
}

export interface SonarrDiskSpace {
  path: string;
  label: string;
  freeSpace: number;
  totalSpace: number;
}

export interface SonarrLookupResult {
  tvdbId: number;
  imdbId?: string;
  title: string;
  sortTitle: string;
  year: number;
  overview?: string;
  runtime: number;
  images: SonarrImage[];
  network?: string;
  genres: string[];
  ratings?: { votes: number; value: number };
  seasons: SonarrSeason[];
  statistics?: SonarrSeriesStatistics;
  status: string;
  seriesType: string;
  certification?: string;
}
