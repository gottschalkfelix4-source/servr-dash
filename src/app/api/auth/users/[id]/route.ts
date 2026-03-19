import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { deleteUser, updateUserPassword, updateUserRole } from "@/lib/auth/users";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await request.json();

    if (body.password) {
      if (body.password.length < 8) {
        return NextResponse.json(
          { error: "Passwort muss mindestens 8 Zeichen haben" },
          { status: 400 }
        );
      }
      await updateUserPassword(id, body.password);
    }

    if (body.role) {
      // Strict role validation
      const validRole = body.role === "admin" ? "admin" : "user";
      updateUserRole(id, validRole);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Update fehlgeschlagen" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.sub) {
    return NextResponse.json(
      { error: "Du kannst deinen eigenen Account nicht löschen" },
      { status: 400 }
    );
  }

  try {
    deleteUser(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Löschen fehlgeschlagen" },
      { status: 500 }
    );
  }
}
