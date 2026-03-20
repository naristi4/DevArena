import { redirect }      from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions }     from "@/lib/auth";
import { getMockPipelineItems }       from "@/lib/pipeline";
import { MOCK_TASKS, ACTIVE_STATUSES } from "@/lib/tasks";
import { prisma }                     from "@/lib/prisma";
import PipelineShell                  from "@/components/PipelineShell";
import type { ActiveTask }            from "@/components/ActiveTasksBoard";

export default async function PipelinePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdminUser = session.user.role === "Admin";
  const userSquad   = session.user.squad ?? "";

  const [squadsRaw, usersRaw] = await Promise.all([
    prisma.squad.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);
  const squads = squadsRaw.map((s) => s.name);
  const users  = usersRaw.map((u) => u.name);
  const currentUser = session.user?.name ?? "Unknown";

  // ── Scope pipeline items to the user's squad for Squad Members ──────────────
  const allItems   = getMockPipelineItems();
  const squadItems = isAdminUser
    ? allItems
    : allItems.filter((p) => p.squad === userSquad);

  // ── Enrich active tasks with parent-project context ────────────────────────
  // Build a project lookup so we can attach title, squad, and due date to tasks.
  // Using squadItems ensures Squad Members only see tasks from their own projects.
  const projectMap = Object.fromEntries(squadItems.map((p) => [p.id, p]));

  const activeTasks: ActiveTask[] = MOCK_TASKS
    .filter((t) => (ACTIVE_STATUSES as string[]).includes(t.status))
    .filter((t) => projectMap[t.project_id] !== undefined)   // only this squad's tasks
    .map((t) => ({
      ...t,
      projectTitle: projectMap[t.project_id]?.title                   ?? "—",
      projectSquad: projectMap[t.project_id]?.squad                   ?? "",
      dueDate:      projectMap[t.project_id]?.target_end_date           ?? "",
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Product Pipeline</h1>
        <p className="mt-1 text-sm text-gray-400">
          From idea to delivery — track every initiative through the full lifecycle.
        </p>
      </div>

      <PipelineShell
        initialItems={squadItems}
        activeTasks={activeTasks}
        squads={squads}
        users={users}
        currentUser={currentUser}
      />
    </div>
  );
}
