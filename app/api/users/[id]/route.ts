import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// ─── PUT /api/users/[id] ───────────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, role, position, avatarUrl, squadId } = body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name      !== undefined && { name }),
        ...(role      !== undefined && { role }),
        ...(position  !== undefined && { position }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(squadId   !== undefined && { squadId: squadId || null }),
      },
      include: { squad: true },
    });

    revalidatePath("/settings/users");

    const { password: _, ...safe } = user;
    return NextResponse.json({ ...safe, squad: user.squad?.name ?? "" });
  } catch (err) {
    console.error("[PUT /api/users/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/users/[id] ────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.user.delete({ where: { id: params.id } });
    revalidatePath("/settings/users");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/users/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
