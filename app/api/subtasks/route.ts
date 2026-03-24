import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Subtask } from "@/lib/subtasks";

// ─── Shared mapper ────────────────────────────────────────────────────────────

export function dbSubtaskToSubtask(st: {
  id: string;
  taskId: string;
  title: string;
  description: string | null;
  status: string;
  assignee: { name: string } | null;
}): Subtask {
  return {
    id:            st.id,
    task_id:       st.taskId,
    title:         st.title,
    description:   st.description ?? "",
    status:        st.status as Subtask["status"],
    assigned_user: st.assignee?.name ?? "",
  };
}

// ─── POST /api/subtasks ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    task_id:       string;
    title:         string;
    description?:  string;
    status?:       string;
    assigned_user?: string;
  };

  if (!body.task_id?.trim()) return NextResponse.json({ error: "task_id required" }, { status: 400 });
  if (!body.title?.trim())   return NextResponse.json({ error: "title required"   }, { status: 400 });

  // Resolve assignee
  let assigneeId: string | undefined;
  if (body.assigned_user) {
    const user = await prisma.user.findFirst({ where: { name: body.assigned_user } });
    assigneeId = user?.id;
  }

  const created = await prisma.subtask.create({
    data: {
      taskId:      body.task_id,
      title:       body.title.trim(),
      description: body.description?.trim() ?? "",
      status:      (body.status ?? "todo") as never,
      assigneeId,
    },
    include: { assignee: { select: { name: true } } },
  });

  return NextResponse.json(dbSubtaskToSubtask(created), { status: 201 });
}
