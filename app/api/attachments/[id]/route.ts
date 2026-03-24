import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

// ─── DELETE /api/attachments/:id ──────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const att = await prisma.attachment.findUnique({
    where:   { id },
    include: {
      uploadedBy: { select: { name: true } },
      project:    { include: { squad: true } },
    },
  });
  if (!att) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userRole    = (session.user as { role?: string }).role;
  const userName    = (session.user as { name?: string }).name ?? "";
  const userSquad   = (session.user as { squad?: string }).squad;
  const isAdmin     = userRole === "Admin";
  const isUploader  = att.uploadedBy?.name === userName;
  const sameSquad   = !!att.project.squad && att.project.squad.name === userSquad;

  if (!isAdmin && !isUploader && !sameSquad) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Remove the file from disk if it's a local upload
  if (att.type === "file" && att.fileUrl.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", att.fileUrl);
    try { await unlink(filePath); } catch { /* file may already be gone */ }
  }

  await prisma.attachment.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
