import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// ─── PUT /api/squads/[id] ──────────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description, leadId } = await req.json();

    const squad = await prisma.squad.update({
      where: { id },
      data: {
        ...(name        !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(leadId      !== undefined && { leadId: leadId || null }),
      },
      include: { lead: { select: { id: true, name: true } } },
    });

    revalidatePath("/settings/squads");

    return NextResponse.json({
      id:          squad.id,
      name:        squad.name,
      description: squad.description ?? "",
      squad_lead:  squad.lead?.name  ?? undefined,
      leadId:      squad.leadId      ?? null,
    });
  } catch (err) {
    console.error("[PUT /api/squads/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/squads/[id] ───────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Unassign all members before deleting
    await prisma.user.updateMany({
      where: { squadId: id },
      data:  { squadId: null },
    });

    await prisma.squad.delete({ where: { id } });
    revalidatePath("/settings/squads");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/squads/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
