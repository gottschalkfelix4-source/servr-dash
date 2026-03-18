import { NextResponse } from "next/server";
import { hasUsers, createUser } from "@/lib/auth/users";
import { createSession } from "@/lib/auth/session";

export async function GET() {
  return NextResponse.json({ needsSetup: !hasUsers() });
}

export async function POST(request: Request) {
  if (hasUsers()) {
    return NextResponse.json(
      { error: "Setup already completed" },
      { status: 400 }
    );
  }

  try {
    const { username, password } = await request.json();
    if (!username || !password || password.length < 4) {
      return NextResponse.json(
        { error: "Username und Passwort erforderlich (min. 4 Zeichen)" },
        { status: 400 }
      );
    }

    const user = await createUser(username, password, "admin");
    await createSession({ sub: user.id, username: user.username, role: user.role });
    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Setup failed" },
      { status: 500 }
    );
  }
}
