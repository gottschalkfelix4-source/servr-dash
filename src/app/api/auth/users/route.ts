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

    if (!username || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Username und Passwort erforderlich (min. 8 Zeichen)" },
        { status: 400 }
      );
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username)) {
      return NextResponse.json(
        { error: "Username: 3-32 Zeichen, nur Buchstaben, Zahlen, _ und -" },
        { status: 400 }
      );
    }

    // Strict role validation
    const validRole = role === "admin" ? "admin" : "user";

    const user = await createUser(username, password, validRole);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Benutzer konnte nicht erstellt werden" },
      { status: 500 }
    );
  }
}
