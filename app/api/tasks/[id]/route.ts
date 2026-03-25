import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dbTaskToTask } from "@/lib/dbMappers";

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    title?:           string;
    description?:     string;
    assigned_to?:     string;
    status?:          string;
    type?:            string;
    priority?:        string;
    target_end_date?: string;
    start_date?:      string;
    completion_date?: string;
    estimated_time?:  number;
    actual_time?:     number;
  };

  let assigneeId: string | null | undefined = undefined;
  if ("assigned_to" in body) {
    if (!body.assigned_to) {
      assigneeId = null;
    } else {
      const user = await prisma.user.findFirst({ where: { name: body.assigned_to } });
      assigneeId = user?.id ?? null;
    }
  }

  const parseDate = (s?: string | null) => {
    if (s === null || s === undefined) return s === null ? null : undefined;
    return new Date(s + "T00:00:00");
  };

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(body.title        !== undefined && { title:          body.title.trim()                }),
      ...(body.description  !== undefined && { description:    body.description                 }),
      ...(assigneeId        !== undefined && { assigneeId                                       }),
      ...(body.status       !== undefined && { status:         body.status   as never           }),
      ...(body.type         !== undefined && { type:           body.type     as never           }),
      ...(body.priority     !== undefined && { priority:       body.priority as never           }),
      ...("target_end_date" in body       && { targetEndDate:  parseDate(body.target_end_date)  }),
      ...("start_date"      in body       && { startDate:      parseDate(body.start_date)       }),
      ...("completion_date" in body       && { completionDate: parseDate(body.completion_date)  }),
      ...(body.estimated_time !== undefined && { estimatedTime: body.estimated_time             }),
      ...(body.actual_time    !== undefined && { actualTime:    body.actual_time                }),
    },
    include: { assignee: { select: { name: true } } },
  });

  return NextResponse.json(dbTaskToTask(updated));
}

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
