export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  state: "running" | "exited" | "paused" | "restarting" | "dead" | "created";
  status: string; // e.g. "Up 3 hours", "Exited (0) 5 minutes ago"
  ports: string;
  created: string;
  size?: string;
}

export interface DockerContainerStats {
  id: string;
  name: string;
  cpuPercent: number;
  memUsage: number; // bytes
  memLimit: number; // bytes
  memPercent: number;
  netIO: { rx: number; tx: number };
  blockIO: { read: number; write: number };
}

export interface DockerContainerInspect {
  id: string;
  name: string;
  image: string;
  state: {
    status: string;
    running: boolean;
    startedAt: string;
    finishedAt: string;
  };
  config: {
    env: string[];
    cmd: string[];
    hostname: string;
    image: string;
  };
  networkSettings: {
    networks: Record<string, { ipAddress: string; gateway: string }>;
    ports: Record<string, { hostIp: string; hostPort: string }[] | null>;
  };
  mounts: {
    type: string;
    source: string;
    destination: string;
    mode: string;
    rw: boolean;
  }[];
}

export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: number; // bytes
  created: string;
}

export interface DockerStack {
  name: string;
  status: string;
  configFiles: string;
}

export type DockerAction = "start" | "stop" | "restart" | "remove";
