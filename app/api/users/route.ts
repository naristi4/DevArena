import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// ─── GET /api/users ────────────────────────────────────────────────────────────
export async function GET() {
  const users = await prisma.user.findMany({
    include: { squad: true },
    orderBy: { name: "asc" },
  });

  const safe = users.map(({ password: _, ...u }) => ({
    ...u,
    squad: u.squad?.name ?? "",
  }));

  return NextResponse.json(safe);
}

// ─── POST /api/users ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  console.log("[POST /api/users] Request received");
  try {
    const body = await req.json();
    const { name, email, password, role, squadId, position, avatarUrl } = body;

    console.log("[POST /api/users] Creating user:", { name, email, role });

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log("[POST /api/users] Email already in use:", email);
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role,
        position:  position  ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
        squadId:   squadId   ?? undefined,
      },
      include: { squad: true },
    });

    console.log("[POST /api/users] User created successfully:", user.id, user.email);

    // Invalidate the settings/users page cache so it re-fetches from DB on next visit
    revalidatePath("/settings/users");

    const { password: __, ...safe } = user;
    return NextResponse.json({ ...safe, squad: user.squad?.name ?? "" }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/users] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
