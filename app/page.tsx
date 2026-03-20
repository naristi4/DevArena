import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let squads: string[] = [];
  try {
    const dbSquads = await prisma.squad.findMany({ select: { name: true }, orderBy: { name: "asc" } });
    squads = dbSquads.map((s) => s.name);
  } catch {
    // DB unavailable — dashboard renders without squad filter
  }

  return (
    <Suspense>
      <DashboardClient squads={squads} />
    </Suspense>
  );
}
