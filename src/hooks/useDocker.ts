import useSWR from "swr";
import type { DockerContainer, DockerContainerStats, DockerImage, DockerStack, DockerContainerInspect } from "@/types/docker";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

const defaultOpts = { revalidateOnFocus: false, dedupingInterval: 5000 };

export function useDockerContainers(serverId: string) {
  return useSWR<{ containers: DockerContainer[] }>(
    serverId ? `/api/docker/${serverId}/containers` : null,
    fetcher,
    { ...defaultOpts, refreshInterval: 10000 }
  );
}

export function useDockerStats(serverId: string) {
  return useSWR<{ stats: DockerContainerStats[] }>(
    serverId ? `/api/docker/${serverId}/containers/_/stats` : null,
    fetcher,
    { ...defaultOpts, refreshInterval: 15000 }
  );
}

export function useDockerImages(serverId: string) {
  return useSWR<{ images: DockerImage[] }>(
    serverId ? `/api/docker/${serverId}/images` : null,
    fetcher,
    { ...defaultOpts, refreshInterval: 30000 }
  );
}

export function useDockerStacks(serverId: string) {
  return useSWR<{ stacks: DockerStack[] }>(
    serverId ? `/api/docker/${serverId}/stacks` : null,
    fetcher,
    { ...defaultOpts, refreshInterval: 30000 }
  );
}

export function useContainerInspect(serverId: string, containerId: string) {
  return useSWR<{ container: DockerContainerInspect }>(
    serverId && containerId
      ? `/api/docker/${serverId}/containers/${containerId}`
      : null,
    fetcher,
    defaultOpts
  );
}

export function useContainerLogs(serverId: string, containerId: string) {
  return useSWR<{ logs: string }>(
    serverId && containerId
      ? `/api/docker/${serverId}/containers/${containerId}/logs`
      : null,
    fetcher,
    { ...defaultOpts, refreshInterval: 10000 }
  );
}

export async function performContainerAction(
  serverId: string,
  containerId: string,
  action: string
) {
  const res = await fetch(
    `/api/docker/${serverId}/containers/${containerId}/action`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }
  );
  return res.json();
}
