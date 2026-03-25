import { redirect }        from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { ACTIVE_STATUSES }  from "@/lib/tasks";
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
    }).catch(() => []),   // empty list if Project table doesn't exist yet
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

  // Load active tasks from DB, scoped to visible projects
  const visibleProjectIds = squadItems.map((p) => p.id);
  const projectMap        = Object.fromEntries(squadItems.map((p) => [p.id, p]));

  const dbActiveTasks = visibleProjectIds.length > 0
    ? await prisma.task.findMany({
        where: {
          projectId: { in: visibleProjectIds },
          status:    { in: [...ACTIVE_STATUSES] as never[] },
        },
        include: {
          assignee: { select: { name: true } },
          subtasks: { include: { assignee: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "asc" },
      }).catch(() => [])
    : [];

  const activeTasks: ActiveTask[] = dbActiveTasks.map((t) => ({
    id:              t.id,
    title:           t.title,
    description:     t.description     ?? "",
    project_id:      t.projectId,
    assigned_to:     t.assignee?.name  ?? "",
    estimated_time:  t.estimatedTime   ?? 0,
    actual_time:     t.actualTime      ?? 0,
    status:          t.status          as ActiveTask["status"],
    type:            t.type            as ActiveTask["type"],
    priority:        t.priority        as ActiveTask["priority"],
    target_end_date: t.targetEndDate   ? fmtDate(t.targetEndDate)  : undefined,
    start_date:      t.startDate       ? fmtDate(t.startDate)      : undefined,
    completion_date: t.completionDate  ? fmtDate(t.completionDate) : undefined,
    projectTitle:    projectMap[t.projectId]?.title          ?? "—",
    projectSquad:    projectMap[t.projectId]?.squad          ?? "",
    dueDate:         projectMap[t.projectId]?.target_end_date ?? "",
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
