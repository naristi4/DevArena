import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── GET /api/health ───────────────────────────────────────────────────────────
// Diagnostic endpoint — checks DB connectivity and env var presence.
export async function GET() {
  const dbUrl = process.env.DATABASE_URL;

  const result: Record<string, unknown> = {
    DATABASE_URL_set: !!dbUrl,
    DATABASE_URL_host: dbUrl
      ? new URL(dbUrl.replace("?pgbouncer=true", "")).host
      : "NOT SET",
    DIRECT_URL_set:    !!process.env.DIRECT_URL,
    NEXTAUTH_SECRET_set: !!process.env.NEXTAUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  };

  try {
    const count = await prisma.user.count();
    result.db_connected = true;
    result.user_count    = count;
  } catch (err: any) {
    result.db_connected = false;
    result.db_error     = err?.message ?? String(err);
  }

  return NextResponse.json(result);
}
