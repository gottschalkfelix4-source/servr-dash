export interface RadarrMovie {
  id: number;
  title: string;
  sortTitle: string;
  year: number;
  tmdbId: number;
  imdbId?: string;
  overview?: string;
  runtime: number;
  genres: string[];
  ratings?: { imdb?: { value: number }; tmdb?: { value: number }; rottenTomatoes?: { value: number } };
  studio?: string;
  path: string;
  qualityProfileId: number;
  monitored: boolean;
  minimumAvailability: string;
  status: string;
  hasFile: boolean;
  sizeOnDisk: number;
  added: string;
  movieFile?: RadarrMovieFile;
  images: RadarrImage[];
  rootFolderPath?: string;
  folderName?: string;
  certification?: string;
  tags: number[];
}

export interface RadarrMovieFile {
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

export interface RadarrImage {
  coverType: "poster" | "banner" | "fanart" | "screenshot" | "headshot";
  url: string;
  remoteUrl: string;
}

export interface RadarrQualityProfile {
  id: number;
  name: string;
  upgradeAllowed: boolean;
  cutoff: number;
}

export interface RadarrRootFolder {
  id: number;
  path: string;
  freeSpace: number;
  totalSpace?: number;
}

export interface RadarrQueueItem {
  id: number;
  movieId: number;
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
  movie?: { title: string; year: number };
}

export interface RadarrHistoryRecord {
  id: number;
  movieId: number;
  sourceTitle: string;
  quality: { quality: { name: string } };
  date: string;
  eventType: string;
  data?: Record<string, string>;
  movie?: { title: string; year: number };
}

export interface RadarrCalendarItem {
  id: number;
  title: string;
  year: number;
  tmdbId: number;
  monitored: boolean;
  hasFile: boolean;
  images: RadarrImage[];
  inCinemas?: string;
  physicalRelease?: string;
  digitalRelease?: string;
  status: string;
}

export interface RadarrStatus {
  version: string;
  appName: string;
  startupPath: string;
  osName?: string;
}

export interface RadarrDiskSpace {
  path: string;
  label: string;
  freeSpace: number;
  totalSpace: number;
}

export interface RadarrLookupResult {
  tmdbId: number;
  imdbId?: string;
  title: string;
  sortTitle: string;
  year: number;
  overview?: string;
  runtime: number;
  images: RadarrImage[];
  ratings?: RadarrMovie["ratings"];
  genres: string[];
  studio?: string;
  certification?: string;
}

export interface RadarrRelease {
  guid: string;
  quality: { quality: { name: string } };
  age: number;
  ageHours: number;
  ageMinutes: number;
  size: number;
  indexer: string;
  indexerId: number;
  title: string;
  seeders?: number;
  leechers?: number;
  protocol: string;
  approved: boolean;
  rejections?: string[];
}
