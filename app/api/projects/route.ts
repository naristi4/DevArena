import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PipelineItem } from "@/lib/pipeline";

// ─── Mapper: Prisma Project → PipelineItem ────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toItem(p: any): PipelineItem {
  const fmtDate = (d: Date | null) =>
    d ? d.toISOString().split("T")[0] : "";

  return {
    id:              p.id,
    title:           p.title,
    description:     p.description ?? "",
    status:          p.status,
    squad:           p.squad?.name  ?? "",
    impact:          p.impact       ?? "Calidad",
    created_by:      p.createdBy?.name ?? "",
    created_at:      p.createdAt.toISOString(),
    prd_url:         p.prdUrl        ?? "",
    odd_url:         p.oddUrl        ?? "",
    trd_url:         p.trdUrl        ?? "",
    start_date:      fmtDate(p.startDate),
    target_end_date: fmtDate(p.targetEndDate),
    completion_date: p.completionDate ? fmtDate(p.completionDate) : undefined,
    attachments:     [],
  };
}

// ─── GET /api/projects ────────────────────────────────────────────────────────
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where:   { deleted: false },
      include: {
        squad:     true,
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects.map(toItem));
  } catch (err) {
    console.error("[GET /api/projects]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/projects ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, description, impact, squadName } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Resolve squad name → ID
    let squadId: string | undefined;
    if (squadName) {
      const squad = await prisma.squad.findUnique({ where: { name: squadName } });
      squadId = squad?.id;
    }

    // Resolve creator ID from session
    const createdById = (session.user as { id?: string }).id;

    const project = await prisma.project.create({
      data: {
        title:       title.trim(),
        description: description?.trim() ?? "",
        status:      "opportunity",
        impact:      impact ?? "Calidad",
        ...(squadId     ? { squadId }     : {}),
        ...(createdById ? { createdById } : {}),
      },
      include: {
        squad:     true,
        createdBy: { select: { id: true, name: true } },
      },
    });

    revalidatePath("/pipeline");
    return NextResponse.json(toItem(project), { status: 201 });
  } catch (err) {
    console.error("[POST /api/projects]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
