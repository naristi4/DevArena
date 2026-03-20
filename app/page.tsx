import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const dbSquads = await prisma.squad.findMany({ select: { name: true }, orderBy: { name: "asc" } });
  const squads = dbSquads.map((s) => s.name);

  return (
    <Suspense>
      <DashboardClient squads={squads} />
    </Suspense>
  );
}
