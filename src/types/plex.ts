export interface PlexServerStatus {
  name: string;
  version: string;
  platform: string;
  online: boolean;
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
  grandparentTitle?: string; // TV show name
  type: "movie" | "episode" | "track";
  year?: number;
  thumb?: string;
  user: string;
  player: string;
  playerPlatform: string;
  videoResolution?: string;
  videoDecision: "directplay" | "copy" | "transcode";
  audioDecision: "directplay" | "copy" | "transcode";
  progress: number; // 0-100
  duration: number; // ms
  viewOffset: number; // ms
  bandwidth?: number;
  transcodeProgress?: number;
}

export interface PlexUser {
  id: string;
  title: string;
  thumb?: string;
}
