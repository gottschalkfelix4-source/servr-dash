import { Client } from "ssh2";
import { readFileSync } from "fs";
import { resolve } from "path";
import type { ServerConfig } from "@/types/server";

interface PooledConnection {
  client: Client;
  serverId: string;
  connected: boolean;
  retryCount: number;
  lastError?: string;
  lastUsed: number;
}

class SSHConnectionPool {
  private connections = new Map<string, PooledConnection>();
  private connecting = new Map<string, Promise<Client>>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private static IDLE_TIMEOUT = 120_000; // 2 minutes

  constructor() {
    // Cleanup idle connections every 30 seconds
    this.cleanupTimer = setInterval(() => this.cleanupIdle(), 30_000);
  }

  private cleanupIdle(): void {
    const now = Date.now();
    for (const [id, conn] of this.connections) {
      if (conn.connected && now - conn.lastUsed > SSHConnectionPool.IDLE_TIMEOUT) {
        conn.client.end();
        this.connections.delete(id);
      }
    }
  }

  async getConnection(server: ServerConfig): Promise<Client> {
    const existing = this.connections.get(server.id);
    if (existing?.connected) {
      existing.lastUsed = Date.now();
      return existing.client;
    }

    // Avoid concurrent connection attempts to the same server
    const pending = this.connecting.get(server.id);
    if (pending) return pending;

    const promise = this.connect(server);
    this.connecting.set(server.id, promise);

    try {
      const client = await promise;
      return client;
    } finally {
      this.connecting.delete(server.id);
    }
  }

  private connect(server: ServerConfig): Promise<Client> {
    return new Promise((resolve, reject) => {
      const client = new Client();
      const timeout = setTimeout(() => {
        client.end();
        reject(new Error(`SSH connection timeout for ${server.host}`));
      }, 10000);

      client.on("ready", () => {
        clearTimeout(timeout);
        this.connections.set(server.id, {
          client,
          serverId: server.id,
          connected: true,
          retryCount: 0,
          lastUsed: Date.now(),
        });
        resolve(client);
      });

      client.on("error", (err) => {
        clearTimeout(timeout);
        const pooled = this.connections.get(server.id);
        if (pooled) {
          pooled.connected = false;
          pooled.lastError = err.message;
          pooled.retryCount++;
        }
        reject(err);
      });

      client.on("close", () => {
        const pooled = this.connections.get(server.id);
        if (pooled) {
          pooled.connected = false;
        }
      });

      const connectConfig: Record<string, unknown> = {
        host: server.host,
        port: server.port || 22,
        username: server.username,
        readyTimeout: 10000,
        keepaliveInterval: 10000,
        keepaliveCountMax: 3,
      };

      if (server.authMethod === "key" && server.privateKeyPath) {
        try {
          const keyPath = server.privateKeyPath.replace("~", process.env.HOME || process.env.USERPROFILE || "");
          connectConfig.privateKey = readFileSync(keyPath);
        } catch (err) {
          clearTimeout(timeout);
          reject(new Error(`Failed to read SSH key: ${server.privateKeyPath}`));
          return;
        }
      } else if (server.password) {
        connectConfig.password = server.password;
      }

      client.connect(connectConfig as Parameters<Client["connect"]>[0]);
    });
  }

  async exec(server: ServerConfig, command: string): Promise<string> {
    const client = await this.getConnection(server);
    return new Promise((resolve, reject) => {
      client.exec(command, (err, stream) => {
        if (err) return reject(err);
        let stdout = "";
        let stderr = "";
        stream.on("data", (data: Buffer) => {
          stdout += data.toString();
        });
        stream.stderr.on("data", (data: Buffer) => {
          stderr += data.toString();
        });
        stream.on("close", (code: number) => {
          if (code !== 0 && stderr) {
            reject(new Error(`Command failed (${code}): ${stderr}`));
          } else {
            resolve(stdout);
          }
        });
      });
    });
  }

  isConnected(serverId: string): boolean {
    return this.connections.get(serverId)?.connected ?? false;
  }

  getStatus(serverId: string): { connected: boolean; error?: string } {
    const conn = this.connections.get(serverId);
    return {
      connected: conn?.connected ?? false,
      error: conn?.lastError,
    };
  }

  disconnect(serverId: string): void {
    const conn = this.connections.get(serverId);
    if (conn) {
      conn.client.end();
      this.connections.delete(serverId);
    }
  }

  disconnectAll(): void {
    for (const [id] of this.connections) {
      this.disconnect(id);
    }
  }
}

// Use globalThis to survive HMR in dev mode
const globalKey = "__sshPool__" as const;
export const sshPool: SSHConnectionPool =
  (globalThis as Record<string, unknown>)[globalKey] as SSHConnectionPool ??
  ((globalThis as Record<string, unknown>)[globalKey] = new SSHConnectionPool());
