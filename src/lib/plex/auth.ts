import { getPlexClientId } from "@/lib/config";

const PLEX_API = "https://plex.tv/api/v2";

function getPlexHeaders() {
  return {
    Accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
    "X-Plex-Client-Identifier": getPlexClientId(),
    "X-Plex-Product": "Servr Dash",
    "X-Plex-Version": "1.0",
    "X-Plex-Platform": "Web",
    "X-Plex-Platform-Version": "1.0",
    "X-Plex-Device": "Web",
    "X-Plex-Device-Name": "Servr Dash",
  };
}

export interface PlexPin {
  id: number;
  code: string;
  authToken: string | null;
  expiresAt: string;
}

export async function createPlexPin(): Promise<PlexPin> {
  const res = await fetch(`${PLEX_API}/pins`, {
    method: "POST",
    headers: getPlexHeaders(),
    body: "strong=true",
  });

  if (!res.ok) {
    throw new Error(`Failed to create Plex PIN: ${res.status}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    code: data.code,
    authToken: data.authToken,
    expiresAt: data.expiresAt,
  };
}

export async function checkPlexPin(pinId: number): Promise<PlexPin> {
  const res = await fetch(`${PLEX_API}/pins/${pinId}`, {
    method: "GET",
    headers: getPlexHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to check Plex PIN: ${res.status}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    code: data.code,
    authToken: data.authToken,
    expiresAt: data.expiresAt,
  };
}

export function getPlexAuthUrl(code: string): string {
  const clientId = getPlexClientId();
  return `https://app.plex.tv/auth#?clientID=${clientId}&code=${code}&context%5Bdevice%5D%5Bproduct%5D=Servr%20Dash`;
}

export async function getPlexServerUrl(token: string): Promise<string | null> {
  try {
    const res = await fetch("https://plex.tv/api/v2/resources?includeHttps=1", {
      headers: {
        ...getPlexHeaders(),
        "X-Plex-Token": token,
      },
    });
    if (!res.ok) return null;

    const resources = await res.json();
    // Find a server resource
    const server = resources.find(
      (r: { provides: string }) => r.provides === "server"
    );
    if (!server) return null;

    // Prefer local connections
    const connections = server.connections || [];
    const local = connections.find(
      (c: { local: boolean }) => c.local
    );
    const conn = local || connections[0];
    return conn?.uri || null;
  } catch {
    return null;
  }
}
