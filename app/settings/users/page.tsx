import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { MOCK_USERS } from "@/lib/users";
import { MOCK_SQUADS } from "@/lib/squads";
import UsersClient from "@/components/UsersClient";

export default async function SettingsUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "Admin") redirect("/");

  // Strip passwords before passing to client
  const users = MOCK_USERS.map(({ password: _, ...u }) => u);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Users</h1>
        <p className="mt-1 text-sm text-slate-400">
          All members across engineering squads
        </p>
      </div>

      <UsersClient initialUsers={users} squads={MOCK_SQUADS.map((s) => s.name)} />
    </div>
  );
}
