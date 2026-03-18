import { NextResponse } from "next/server";
import { cloudflareClient } from "@/lib/cloudflare/client";

export const dynamic = "force-dynamic";

// GET: List records for a zone
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const zoneId = url.searchParams.get("zoneId");
    const type = url.searchParams.get("type") || undefined;
    if (!zoneId) {
      return NextResponse.json({ error: "zoneId required" }, { status: 400 });
    }
    const records = await cloudflareClient.getRecords(zoneId, type);
    return NextResponse.json(records);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cloudflare error" },
      { status: 500 }
    );
  }
}

// POST: Create a new record
export async function POST(request: Request) {
  try {
    const { zoneId, ...record } = await request.json();
    if (!zoneId) {
      return NextResponse.json({ error: "zoneId required" }, { status: 400 });
    }
    const result = await cloudflareClient.createRecord(zoneId, record);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Create failed" },
      { status: 500 }
    );
  }
}

// PUT: Update a record
export async function PUT(request: Request) {
  try {
    const { zoneId, recordId, ...record } = await request.json();
    if (!zoneId || !recordId) {
      return NextResponse.json({ error: "zoneId and recordId required" }, { status: 400 });
    }
    const result = await cloudflareClient.updateRecord(zoneId, recordId, record);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a record
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const zoneId = url.searchParams.get("zoneId");
    const recordId = url.searchParams.get("recordId");
    if (!zoneId || !recordId) {
      return NextResponse.json({ error: "zoneId and recordId required" }, { status: 400 });
    }
    await cloudflareClient.deleteRecord(zoneId, recordId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
