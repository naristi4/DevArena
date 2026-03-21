import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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

function parseDate(s: string | undefined | null): Date | null {
  if (!s) return null;
  return new Date(s + "T00:00:00.000Z");
}

// ─── PUT /api/projects/[id] ───────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body   = await req.json();
    const {
      title,
      description,
      status,
      impact,
      squadName,
      prd_url,
      odd_url,
      trd_url,
      start_date,
      target_end_date,
      completion_date,
    } = body;

    // Resolve squad name → ID when provided
    let squadId: string | null | undefined;
    if (squadName !== undefined) {
      if (!squadName) {
        squadId = null;
      } else {
        const squad = await prisma.squad.findUnique({ where: { name: squadName } });
        squadId = squad?.id ?? null;
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(title           !== undefined && { title:          title.trim()         }),
        ...(description     !== undefined && { description:    description.trim()   }),
        ...(status          !== undefined && { status                               }),
        ...(impact          !== undefined && { impact                               }),
        ...(squadId         !== undefined && { squadId                              }),
        ...(prd_url         !== undefined && { prdUrl:         prd_url              }),
        ...(odd_url         !== undefined && { oddUrl:         odd_url              }),
        ...(trd_url         !== undefined && { trdUrl:         trd_url              }),
        ...(start_date      !== undefined && { startDate:      parseDate(start_date)      }),
        ...(target_end_date !== undefined && { targetEndDate:  parseDate(target_end_date) }),
        ...(completion_date !== undefined && {
          completionDate: completion_date ? parseDate(completion_date) : null,
        }),
      },
      include: {
        squad:     true,
        createdBy: { select: { id: true, name: true } },
      },
    });

    revalidatePath("/pipeline");
    revalidatePath(`/projects/${id}`);

    return NextResponse.json(toItem(project));
  } catch (err) {
    console.error("[PUT /api/projects/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/projects/[id] ────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.project.update({
      where: { id },
      data:  { deleted: true },
    });
    revalidatePath("/pipeline");
    revalidatePath(`/projects/${id}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/projects/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
