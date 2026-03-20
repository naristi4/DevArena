import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SquadsClient from "@/components/SquadsClient";

export const dynamic = "force-dynamic";

export default async function SettingsSquadsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "Admin") redirect("/");

  const [dbSquads, dbUsersRaw] = await Promise.all([
    prisma.squad.findMany({
      include: { lead: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ include: { squad: true }, orderBy: { name: "asc" } }),
  ]);

  const squads = dbSquads.map((s) => ({
    id:          s.id,
    name:        s.name,
    description: s.description ?? "",
    squad_lead:  s.lead?.name  ?? undefined,
    leadId:      s.leadId      ?? null,
  }));

  const users = dbUsersRaw.map(({ password: _, squad, ...u }) => ({
    id:      u.id,
    name:    u.name,
    email:   u.email,
    role:    u.role,
    squad:   squad?.name ?? "",
    squadId: u.squadId   ?? null,
  }));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Squads</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage engineering squads, leads, and member assignments.
        </p>
      </div>
      <SquadsClient initialSquads={squads} initialUsers={users} />
    </div>
  );
}
