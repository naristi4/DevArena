import { redirect }        from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { MOCK_TASKS, ACTIVE_STATUSES } from "@/lib/tasks";
import { prisma }           from "@/lib/prisma";
import PipelineShell        from "@/components/PipelineShell";
import type { ActiveTask }  from "@/components/ActiveTasksBoard";
import type { PipelineItem } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdminUser = session.user.role === "Admin";
  const userSquad   = session.user.squad ?? "";
  const currentUser = session.user?.name ?? "Unknown";

  const [squadsRaw, usersRaw, dbProjects] = await Promise.all([
    prisma.squad.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.project.findMany({
      where:   { deleted: false },
      include: {
        squad:     true,
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const squads = squadsRaw.map((s) => s.name);
  const users  = usersRaw.map((u) => u.name);

  // Map Prisma projects → PipelineItem shape
  const fmtDate = (d: Date | null) => d ? d.toISOString().split("T")[0] : "";
  const allItems: PipelineItem[] = dbProjects.map((p) => ({
    id:              p.id,
    title:           p.title,
    description:     p.description    ?? "",
    status:          p.status,
    squad:           p.squad?.name    ?? "",
    impact:          (p.impact        ?? "Calidad") as PipelineItem["impact"],
    created_by:      p.createdBy?.name ?? currentUser,
    created_at:      p.createdAt.toISOString(),
    prd_url:         p.prdUrl         ?? "",
    odd_url:         p.oddUrl         ?? "",
    trd_url:         p.trdUrl         ?? "",
    start_date:      fmtDate(p.startDate),
    target_end_date: fmtDate(p.targetEndDate),
    completion_date: p.completionDate ? fmtDate(p.completionDate) : undefined,
    attachments:     [],
  }));

  // Scope to user's squad for Squad Members
  const squadItems = isAdminUser
    ? allItems
    : allItems.filter((p) => p.squad === userSquad);

  // Active tasks still use mock data — tasks module not yet migrated
  const projectMap = Object.fromEntries(squadItems.map((p) => [p.id, p]));
  const activeTasks: ActiveTask[] = MOCK_TASKS
    .filter((t) => (ACTIVE_STATUSES as string[]).includes(t.status))
    .filter((t) => projectMap[t.project_id] !== undefined)
    .map((t) => ({
      ...t,
      projectTitle: projectMap[t.project_id]?.title          ?? "—",
      projectSquad: projectMap[t.project_id]?.squad          ?? "",
      dueDate:      projectMap[t.project_id]?.target_end_date ?? "",
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
