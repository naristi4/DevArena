export const dynamic = "force-dynamic"; // always fetch fresh data from DB

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UsersClient from "@/components/UsersClient";

export default async function SettingsUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "Admin") redirect("/");

  const [dbUsers, dbSquads] = await Promise.all([
    prisma.user.findMany({
      include:  { squad: true },
      orderBy:  { name: "asc" },
    }),
    prisma.squad.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Strip password and normalize null → undefined for optional fields
  const users = dbUsers.map(({ password: _, squad, ...u }) => ({
    id:        u.id,
    name:      u.name,
    email:     u.email,
    role:      u.role,
    squad:     squad?.name ?? "",
    squadId:   u.squadId   ?? null,
    position:  u.position  ?? undefined,
    avatarUrl: u.avatarUrl ?? undefined,
  }));

  const squads = dbSquads.map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Users</h1>
        <p className="mt-1 text-sm text-slate-400">
          All members across engineering squads
        </p>
      </div>

      <UsersClient initialUsers={users} squads={squads} />
    </div>
  );
}
