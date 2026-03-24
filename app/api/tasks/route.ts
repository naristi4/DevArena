import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Task } from "@/lib/tasks";

// ─── Shared mapper ────────────────────────────────────────────────────────────

export function dbTaskToTask(t: {
  id: string;
  title: string;
  description: string | null;
  projectId: string;
  status: string;
  type: string;
  priority: string;
  estimatedTime: number | null;
  actualTime: number | null;
  targetEndDate: Date | null;
  startDate: Date | null;
  completionDate: Date | null;
  assignee: { name: string } | null;
}): Task {
  const d = (dt: Date | null) => dt ? dt.toISOString().split("T")[0] : undefined;
  return {
    id:              t.id,
    title:           t.title,
    description:     t.description ?? "",
    project_id:      t.projectId,
    assigned_to:     t.assignee?.name ?? "",
    estimated_time:  t.estimatedTime ?? 0,
    actual_time:     t.actualTime    ?? 0,
    status:          t.status   as Task["status"],
    type:            t.type     as Task["type"],
    priority:        t.priority as Task["priority"],
    target_end_date: d(t.targetEndDate),
    start_date:      d(t.startDate),
    completion_date: d(t.completionDate),
  };
}

// ─── POST /api/tasks ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    title:           string;
    description?:    string;
    project_id:      string;
    assigned_to?:    string;
    status?:         string;
    type?:           string;
    priority?:       string;
    target_end_date?: string;
    start_date?:     string;
    completion_date?: string;
  };

  if (!body.title?.trim())      return NextResponse.json({ error: "title required"      }, { status: 400 });
  if (!body.project_id?.trim()) return NextResponse.json({ error: "project_id required" }, { status: 400 });

  // Resolve assignee name → DB id (best-effort)
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
      status:         (body.status   ?? "backlog")  as never,
      type:           (body.type     ?? "task")      as never,
      priority:       (body.priority ?? "medium")   as never,
      targetEndDate:  parseDate(body.target_end_date),
      startDate:      parseDate(body.start_date),
      completionDate: parseDate(body.completion_date),
    },
    include: { assignee: { select: { name: true } } },
  });

  return NextResponse.json(dbTaskToTask(created), { status: 201 });
}
