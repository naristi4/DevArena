import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// ─── GET /api/squads ───────────────────────────────────────────────────────────
export async function GET() {
  try {
    const squads = await prisma.squad.findMany({
      include: { lead: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      squads.map((s) => ({
        id:          s.id,
        name:        s.name,
        description: s.description ?? "",
        squad_lead:  s.lead?.name  ?? undefined,
        leadId:      s.leadId      ?? null,
      }))
    );
  } catch (err) {
    console.error("[GET /api/squads]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/squads ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { name, description, leadId } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const squad = await prisma.squad.create({
      data: {
        name:        name.trim(),
        description: description?.trim() ?? "",
        ...(leadId ? { leadId } : {}),
      },
      include: { lead: { select: { id: true, name: true } } },
    });

    revalidatePath("/settings/squads");

    return NextResponse.json(
      {
        id:          squad.id,
        name:        squad.name,
        description: squad.description ?? "",
        squad_lead:  squad.lead?.name  ?? undefined,
        leadId:      squad.leadId      ?? null,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "A squad with this name already exists" },
        { status: 409 }
      );
    }
    console.error("[POST /api/squads]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
