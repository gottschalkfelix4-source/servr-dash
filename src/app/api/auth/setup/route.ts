import { NextResponse } from "next/server";
import { hasUsers, createUser } from "@/lib/auth/users";
import { createSession } from "@/lib/auth/session";

// Lock to prevent race condition during setup
let setupInProgress = false;

export async function GET() {
  return NextResponse.json({ needsSetup: !hasUsers() });
}

export async function POST(request: Request) {
  // Atomic check: prevent race condition with lock
  if (setupInProgress || hasUsers()) {
    return NextResponse.json(
      { error: "Setup already completed" },
      { status: 400 }
    );
  }

  setupInProgress = true;

  try {
    const { username, password } = await request.json();

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

    // Double-check after acquiring lock
    if (hasUsers()) {
      return NextResponse.json(
        { error: "Setup already completed" },
        { status: 400 }
      );
    }

    const user = await createUser(username, password, "admin");
    await createSession({ sub: user.id, username: user.username, role: user.role });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Setup fehlgeschlagen" },
      { status: 500 }
    );
  } finally {
    setupInProgress = false;
  }
}
