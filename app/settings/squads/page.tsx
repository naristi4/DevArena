import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { MOCK_SQUADS } from "@/lib/squads";
import { MOCK_USERS } from "@/lib/users";
import SquadsClient from "@/components/SquadsClient";

export default async function SettingsSquadsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "Admin") redirect("/");

  // Strip passwords before passing to client
  const users = MOCK_USERS.map(({ password: _, ...u }) => u);

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
