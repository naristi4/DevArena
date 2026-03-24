import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toAttachment(a: {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  createdAt: Date;
  uploadedBy: { name: string } | null;
}) {
  return {
    id:          a.id,
    type:        a.type as "file" | "link",
    file_name:   a.fileName,
    file_url:    a.fileUrl,
    uploaded_by: a.uploadedBy?.name ?? "Unknown",
    uploaded_at: a.createdAt.toISOString(),
  };
}

// ─── GET /api/projects/:id/attachments ────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  const rows = await prisma.attachment.findMany({
    where:   { projectId },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rows.map(toAttachment));
}

// ─── POST /api/projects/:id/attachments ───────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  // Verify project exists and user has access (same squad or admin)
  const project = await prisma.project.findFirst({
    where:   { id: projectId, deleted: false },
    include: { squad: true },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const userRole  = (session.user as { role?: string }).role;
  const userSquad = (session.user as { squad?: string }).squad;
  const isAdmin   = userRole === "Admin";
  const sameSquad = !!project.squad && project.squad.name === userSquad;
  if (!isAdmin && !sameSquad) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Find the uploader's DB id
  const uploader = await prisma.user.findFirst({
    where: { name: (session.user as { name?: string }).name ?? "" },
  });

  const contentType = req.headers.get("content-type") ?? "";

  // ── Link attachment ────────────────────────────────────────────────────────
  if (contentType.includes("application/json")) {
    const body = await req.json() as { name?: string; url?: string };
    const name = (body.name ?? "").trim();
    const url  = (body.url  ?? "").trim();

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!url)  return NextResponse.json({ error: "URL is required"  }, { status: 400 });

    // Basic URL validation
    try { new URL(url); } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const att = await prisma.attachment.create({
      data: {
        type:        "link",
        fileName:    name,
        fileUrl:     url,
        projectId,
        uploadedById: uploader?.id,
      },
      include: { uploadedBy: { select: { name: true } } },
    });

    return NextResponse.json(toAttachment(att), { status: 201 });
  }

  // ── File attachment ────────────────────────────────────────────────────────
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    const name     = ((formData.get("name") as string | null) ?? "").trim();

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const displayName = name || file.name;
    const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const uploadDir    = path.join(process.cwd(), "public", "uploads", projectId);

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, safeFileName), buffer);

    const fileUrl = `/uploads/${projectId}/${safeFileName}`;

    const att = await prisma.attachment.create({
      data: {
        type:         "file",
        fileName:     displayName,
        fileUrl:      fileUrl,
        projectId,
        uploadedById: uploader?.id,
      },
      include: { uploadedBy: { select: { name: true } } },
    });

    return NextResponse.json(toAttachment(att), { status: 201 });
  }

  return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
}
