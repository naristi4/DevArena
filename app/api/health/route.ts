import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── GET /api/health ───────────────────────────────────────────────────────────
// Diagnostic endpoint — checks DB connectivity, env vars, and table presence.
export async function GET() {
  const dbUrl = process.env.DATABASE_URL;

  const result: Record<string, unknown> = {
    DATABASE_URL_set:    !!dbUrl,
    DATABASE_URL_host:   dbUrl
      ? new URL(dbUrl.replace("?pgbouncer=true", "")).host
      : "NOT SET",
    DIRECT_URL_set:      !!process.env.DIRECT_URL,
    NEXTAUTH_SECRET_set: !!process.env.NEXTAUTH_SECRET,
    NODE_ENV:            process.env.NODE_ENV,
  };

  // Check user table
  try {
    result.user_count    = await prisma.user.count();
    result.db_connected  = true;
  } catch (err: any) {
    result.db_connected  = false;
    result.db_error      = err?.message ?? String(err);
  }

  // Check project table
  try {
    result.project_count = await prisma.project.count();
    result.project_table = "ok";
  } catch (err: any) {
    result.project_table = "ERROR";
    result.project_error = err?.message ?? String(err);
  }

  // Check squad table
  try {
    result.squad_count   = await prisma.squad.count();
    result.squad_table   = "ok";
  } catch (err: any) {
    result.squad_table   = "ERROR";
    result.squad_error   = err?.message ?? String(err);
  }

  return NextResponse.json(result);
}
