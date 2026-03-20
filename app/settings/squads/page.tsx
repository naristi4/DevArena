import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { MOCK_SQUADS } from "@/lib/squads";
import { prisma } from "@/lib/prisma";
import SquadsClient from "@/components/SquadsClient";

export default async function SettingsSquadsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "Admin") redirect("/");

  // Strip passwords before passing to client
  const dbUsersRaw = await prisma.user.findMany({ include: { squad: true }, orderBy: { name: "asc" } });
  const users = dbUsersRaw.map(({ password: _, squad, ...u }) => ({ ...u, squad: squad?.name ?? "" }));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Squads</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage engineering squads, leads, and member assignments.
        </p>
      </div>
      <SquadsClient initialSquads={MOCK_SQUADS} initialUsers={users} />
    </div>
  );
}
