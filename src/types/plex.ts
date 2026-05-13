export interface PlexServerStatus {
  name: string;
  version: string;
  platform: string;
  online: boolean;
  error?: string;
}

export interface PlexLibrary {
  key: string;
  title: string;
  type: "movie" | "show" | "artist" | "photo";
  count: number;
  icon: string;
}

export interface PlexSession {
  sessionKey: string;
  title: string;
  parentTitle?: string;
  grandparentTitle?: string; // TV show name
  type: "movie" | "episode" | "track";
  year?: number;
  thumb?: string;
  librarySectionTitle?: string;
  user: string;
  player: string;
  playerAddress?: string;
  playerState?: "playing" | "paused" | "buffering" | "stopped";
  playerPlatform: string;
  videoResolution?: string;
  videoCodec?: string;
  audioCodec?: string;
  container?: string;
  bitrate?: number; // kbps
  videoDecision: "directplay" | "copy" | "transcode";
  audioDecision: "directplay" | "copy" | "transcode";
  progress: number; // 0-100
  duration: number; // ms
  viewOffset: number; // ms
  bandwidth?: number;
  transcodeSpeed?: number;
  transcodeThrottled?: boolean;
  transcodeProgress?: number;
}

export interface PlexUser {
  id: string;
  title: string;
  thumb?: string;
}
