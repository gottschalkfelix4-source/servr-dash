import { exec } from "child_process";
import { promisify } from "util";
import { sshPool } from "@/lib/ssh/connection-pool";
import type { ServerConfig } from "@/types/server";

const execAsync = promisify(exec);
const LOCAL_TIMEOUT_MS = 15_000;
const LOCAL_MAX_BUFFER = 1024 * 1024 * 4;

export function isLocalMetricsServer(server: ServerConfig): boolean {
  return server.metricsSource === "local";
}

export async function execServerCommand(
  server: ServerConfig,
  command: string
): Promise<string> {
  if (!isLocalMetricsServer(server)) {
    return sshPool.exec(server, command);
  }

  const { stdout, stderr } = await execAsync(command, {
    shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
    timeout: LOCAL_TIMEOUT_MS,
    maxBuffer: LOCAL_MAX_BUFFER,
    windowsHide: true,
  });

  if (stderr.trim()) {
    return stdout;
  }

  return stdout;
}
