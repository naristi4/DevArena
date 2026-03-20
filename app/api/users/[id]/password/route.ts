import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// ─── PUT /api/users/[id]/password ─────────────────────────────────────────────
// Verifies currentPassword and updates to newPassword.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data:  { password: hashed },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PUT /api/users/[id]/password]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
