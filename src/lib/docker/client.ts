import { sshPool } from "@/lib/ssh/connection-pool";
import type { ServerConfig } from "@/types/server";
import type {
  DockerContainer,
  DockerContainerStats,
  DockerContainerInspect,
  DockerImage,
  DockerStack,
  DockerAction,
} from "@/types/docker";

// Strict validation for Docker IDs (container, image)
// Docker IDs: hex strings (short or full), or name:tag format
const DOCKER_ID_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_.\-/:]*$/;
const MAX_ID_LENGTH = 256;

function validateDockerIdOrThrow(id: string, label: string): void {
  if (
    !id ||
    id.length > MAX_ID_LENGTH ||
    !DOCKER_ID_REGEX.test(id)
  ) {
    throw new Error(`Invalid ${label}: contains disallowed characters`);
  }
}

function validatePositiveInt(value: number, label: string, max = 10000): number {
  const n = Math.floor(value);
  if (!Number.isFinite(n) || n < 1) return 200;
  return Math.min(n, max);
}

function parseJsonLines<T>(output: string): T[] {
  return output
    .trim()
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line) as T;
      } catch {
        return null;
      }
    })
    .filter((item): item is T => item !== null);
}

export class DockerClient {
  constructor(private server: ServerConfig) {}

  private async exec(command: string): Promise<string> {
    return sshPool.exec(this.server, command);
  }

  // Container operations
  async listContainers(): Promise<DockerContainer[]> {
    const output = await this.exec(
      `docker ps -a --format '{"id":"{{.ID}}","name":"{{.Names}}","image":"{{.Image}}","state":"{{.State}}","status":"{{.Status}}","ports":"{{.Ports}}","created":"{{.CreatedAt}}"}'`
    );
    return parseJsonLines<DockerContainer>(output);
  }

  async inspectContainer(containerId: string): Promise<DockerContainerInspect> {
    validateDockerIdOrThrow(containerId, "container ID");
    const output = await this.exec(`docker inspect ${containerId}`);
    const data = JSON.parse(output);
    const c = data[0];
    return {
      id: c.Id,
      name: c.Name?.replace(/^\//, ""),
      image: c.Config?.Image,
      state: {
        status: c.State?.Status,
        running: c.State?.Running,
        startedAt: c.State?.StartedAt,
        finishedAt: c.State?.FinishedAt,
      },
      config: {
        env: c.Config?.Env || [],
        cmd: c.Config?.Cmd || [],
        hostname: c.Config?.Hostname,
        image: c.Config?.Image,
      },
      networkSettings: {
        networks: Object.fromEntries(
          Object.entries(c.NetworkSettings?.Networks || {}).map(
            ([name, net]) => [
              name,
              {
                ipAddress: ((net as Record<string, unknown>).IPAddress as string) || "",
                gateway: ((net as Record<string, unknown>).Gateway as string) || "",
              },
            ]
          )
        ),
        ports: c.NetworkSettings?.Ports || {},
      },
      mounts: (c.Mounts || []).map(
        (m: Record<string, unknown>) => ({
          type: m.Type,
          source: m.Source,
          destination: m.Destination,
          mode: m.Mode,
          rw: m.RW,
        })
      ),
    };
  }

  async containerAction(containerId: string, action: DockerAction): Promise<string> {
    validateDockerIdOrThrow(containerId, "container ID");
    switch (action) {
      case "start":
        return this.exec(`docker start ${containerId}`);
      case "stop":
        return this.exec(`docker stop ${containerId}`);
      case "restart":
        return this.exec(`docker restart ${containerId}`);
      case "remove":
        return this.exec(`docker rm -f ${containerId}`);
    }
  }

  async containerLogs(containerId: string, tail = 200): Promise<string> {
    validateDockerIdOrThrow(containerId, "container ID");
    const safeTail = validatePositiveInt(tail, "tail");
    return this.exec(`docker logs --tail ${safeTail} --timestamps ${containerId} 2>&1`);
  }

  async containerStats(): Promise<DockerContainerStats[]> {
    const output = await this.exec(
      `docker stats --no-stream --format '{"id":"{{.ID}}","name":"{{.Name}}","cpuPercent":"{{.CPUPerc}}","memUsage":"{{.MemUsage}}","memPercent":"{{.MemPerc}}","netIO":"{{.NetIO}}","blockIO":"{{.BlockIO}}"}'`
    );

    return parseJsonLines<Record<string, string>>(output).map((raw) => {
      const parseSize = (s: string): number => {
        const match = s.match(/([\d.]+)\s*(B|KiB|MiB|GiB|kB|MB|GB)/i);
        if (!match) return 0;
        const val = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        const multipliers: Record<string, number> = {
          b: 1,
          kib: 1024,
          kb: 1000,
          mib: 1024 * 1024,
          mb: 1e6,
          gib: 1024 * 1024 * 1024,
          gb: 1e9,
        };
        return val * (multipliers[unit] || 1);
      };

      const memParts = raw.memUsage.split("/").map((s) => s.trim());
      const netParts = raw.netIO.split("/").map((s) => s.trim());
      const blockParts = raw.blockIO.split("/").map((s) => s.trim());

      return {
        id: raw.id,
        name: raw.name,
        cpuPercent: parseFloat(raw.cpuPercent) || 0,
        memUsage: parseSize(memParts[0]),
        memLimit: parseSize(memParts[1] || "0"),
        memPercent: parseFloat(raw.memPercent) || 0,
        netIO: {
          rx: parseSize(netParts[0]),
          tx: parseSize(netParts[1] || "0"),
        },
        blockIO: {
          read: parseSize(blockParts[0]),
          write: parseSize(blockParts[1] || "0"),
        },
      };
    });
  }

  // Image operations
  async listImages(): Promise<DockerImage[]> {
    const output = await this.exec(
      `docker images --format '{"id":"{{.ID}}","repository":"{{.Repository}}","tag":"{{.Tag}}","size":"{{.Size}}","created":"{{.CreatedAt}}"}'`
    );
    return parseJsonLines<DockerImage>(output).map((img) => ({
      ...img,
      size: typeof img.size === "string" ? 0 : img.size,
    }));
  }

  async removeImage(imageId: string): Promise<string> {
    validateDockerIdOrThrow(imageId, "image ID");
    return this.exec(`docker rmi ${imageId}`);
  }

  // Compose stack operations
  async listStacks(): Promise<DockerStack[]> {
    try {
      const output = await this.exec(`docker compose ls --format json`);
      return JSON.parse(output) as DockerStack[];
    } catch {
      return [];
    }
  }
}

export function getDockerClient(server: ServerConfig): DockerClient {
  return new DockerClient(server);
}
