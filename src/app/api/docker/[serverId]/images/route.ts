import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { getDockerClient } from "@/lib/docker/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  const config = getConfig();
  const server = config.servers.find((s) => s.id === serverId);

  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  try {
    const client = getDockerClient(server);
    const images = await client.listImages();
    return NextResponse.json({ images });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Docker error" },
      { status: 503 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  const config = getConfig();
  const server = config.servers.find((s) => s.id === serverId);

  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  const body = await request.json();
  const imageId = body.imageId as string;

  if (!imageId) {
    return NextResponse.json({ error: "imageId required" }, { status: 400 });
  }

  try {
    const client = getDockerClient(server);
    await client.removeImage(imageId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Docker error" },
      { status: 503 }
    );
  }
}
