import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dbTaskToTask } from "@/lib/dbMappers";

// ─── POST /api/tasks ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    title:            string;
    description?:     string;
    project_id:       string;
    assigned_to?:     string;
    status?:          string;
    type?:            string;
    priority?:        string;
    target_end_date?: string;
    start_date?:      string;
    completion_date?: string;
  };

  if (!body.title?.trim())      return NextResponse.json({ error: "title required"      }, { status: 400 });
  if (!body.project_id?.trim()) return NextResponse.json({ error: "project_id required" }, { status: 400 });

  let assigneeId: string | undefined;
  if (body.assigned_to) {
    const user = await prisma.user.findFirst({ where: { name: body.assigned_to } });
    assigneeId = user?.id;
  }

  const parseDate = (s?: string) => s ? new Date(s + "T00:00:00") : null;

  const created = await prisma.task.create({
    data: {
      title:          body.title.trim(),
      description:    body.description?.trim() ?? "",
      projectId:      body.project_id,
      assigneeId,
      status:         (body.status   ?? "backlog") as never,
      type:           (body.type     ?? "task")    as never,
      priority:       (body.priority ?? "medium")  as never,
      targetEndDate:  parseDate(body.target_end_date),
      startDate:      parseDate(body.start_date),
      completionDate: parseDate(body.completion_date),
    },
    include: { assignee: { select: { name: true } } },
  });

  return NextResponse.json(dbTaskToTask(created), { status: 201 });
}
