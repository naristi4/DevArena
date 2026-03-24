import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dbSubtaskToSubtask } from "@/app/api/subtasks/route";

// ─── PUT /api/subtasks/:id ────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const body = await req.json() as {
    title?:         string;
    description?:   string;
    status?:        string;
    assigned_user?: string;
  };

  // Resolve assignee
  let assigneeId: string | null | undefined = undefined;
  if ("assigned_user" in body) {
    if (!body.assigned_user) {
      assigneeId = null;
    } else {
      const user = await prisma.user.findFirst({ where: { name: body.assigned_user } });
      assigneeId = user?.id ?? null;
    }
  }

  const updated = await prisma.subtask.update({
    where: { id },
    data: {
      ...(body.title       !== undefined && { title:       body.title.trim()     }),
      ...(body.description !== undefined && { description: body.description      }),
      ...(body.status      !== undefined && { status:      body.status as never  }),
      ...(assigneeId       !== undefined && { assigneeId                         }),
    },
    include: { assignee: { select: { name: true } } },
  });

  return NextResponse.json(dbSubtaskToSubtask(updated));
}

// ─── DELETE /api/subtasks/:id ─────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.subtask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
