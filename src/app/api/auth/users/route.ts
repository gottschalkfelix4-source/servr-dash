import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSafeUsers, createUser } from "@/lib/auth/users";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ users: getSafeUsers() });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { username, password, role } = await request.json();
    if (!username || !password || password.length < 4) {
      return NextResponse.json(
        { error: "Username und Passwort erforderlich (min. 4 Zeichen)" },
        { status: 400 }
      );
    }

    const user = await createUser(username, password, role || "user");
    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create user" },
      { status: 500 }
    );
  }
}
