import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MOCK_TASKS } from "@/lib/tasks";
import { prisma } from "@/lib/prisma";
import { getSquadLeaderboard } from "@/lib/gamification";
import ProjectDetailContent from "@/components/ProjectDetailContent";
import type { PipelineItem } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MS_DAY = 1000 * 60 * 60 * 24;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const [dbProject, userNamesRaw, squadsRaw, dbAttachments] = await Promise.all([
    prisma.project.findFirst({
      where:   { id, deleted: false },
      include: {
        squad:     true,
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.user.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.squad.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.attachment.findMany({
      where:   { projectId: id },
      include: { uploadedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!dbProject) notFound();

  const fmtDate = (d: Date | null) => d ? d.toISOString().split("T")[0] : "";

  const item: PipelineItem = {
    id:              dbProject.id,
    title:           dbProject.title,
    description:     dbProject.description    ?? "",
    status:          dbProject.status,
    squad:           dbProject.squad?.name    ?? "",
    impact:          (dbProject.impact        ?? "Calidad") as PipelineItem["impact"],
    created_by:      dbProject.createdBy?.name ?? "",
    created_at:      dbProject.createdAt.toISOString(),
    prd_url:         dbProject.prdUrl         ?? "",
    odd_url:         dbProject.oddUrl         ?? "",
    trd_url:         dbProject.trdUrl         ?? "",
    start_date:      fmtDate(dbProject.startDate),
    target_end_date: fmtDate(dbProject.targetEndDate),
    completion_date: dbProject.completionDate ? fmtDate(dbProject.completionDate) : undefined,
    attachments: dbAttachments.map((a) => ({
      id:          a.id,
      type:        (a.type ?? "file") as "file" | "link",
      file_name:   a.fileName,
      file_url:    a.fileUrl,
      uploaded_by: a.uploadedBy?.name ?? "Unknown",
      uploaded_at: a.createdAt.toISOString(),
    })),
  };

  const userNames = userNamesRaw.map((u) => u.name);
  const squads    = squadsRaw.map((s) => s.name);

  // Tasks are still mock — task module not yet migrated
  const tasks = MOCK_TASKS.filter((t) => t.project_id === id);

  // ── Edit permission ─────────────────────────────────────────────────────────
  const userSquad = (session.user as { squad?: string }).squad;
  const userRole  = (session.user as { role?: string }).role;
  const isAdmin   = userRole === "Admin";
  const canEdit   = isAdmin || (!!item.squad && item.squad === userSquad);

  // ── Timeline metrics ────────────────────────────────────────────────────────
  const totalTasks  = tasks.length;
  const doneCount   = tasks.filter((t) => t.status === "done").length;
  const progressPct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  const today     = new Date();
  const startDate = item.start_date      ? new Date(item.start_date      + "T00:00:00") : null;
  const endDate   = item.target_end_date ? new Date(item.target_end_date + "T00:00:00") : null;

  const daysElapsed = startDate
    ? Math.max(Math.floor((today.getTime() - startDate.getTime()) / MS_DAY), 0)
    : 0;
  const daysPlanned = startDate && endDate
    ? Math.max(Math.floor((endDate.getTime() - startDate.getTime()) / MS_DAY), 1)
    : null;
  const timelinePct = daysPlanned
    ? Math.min(Math.round((daysElapsed / daysPlanned) * 100), 100)
    : 0;

  // ── On-time delivery ────────────────────────────────────────────────────────
  const doneWithDates = tasks.filter(
    (t) => t.status === "done" && t.target_end_date && t.completion_date && t.type !== "iteration"
  );
  const onTimeCount = doneWithDates.filter((t) => t.completion_date! <= t.target_end_date!).length;
  const lateCount   = doneWithDates.length - onTimeCount;
  const onTimePct   = doneWithDates.length > 0
    ? Math.round((onTimeCount / doneWithDates.length) * 100)
    : null;

  // ── Team members ────────────────────────────────────────────────────────────
  const squadLeaders = getSquadLeaderboard(false);
  const squadData    = squadLeaders.find((s) => s.squad === item.squad);
  const teamMembers  = squadData?.members ?? [];

  return (
    <ProjectDetailContent
      item={item}
      tasks={tasks}
      userNames={userNames}
      squads={squads}
      currentUser={(session.user as { name?: string })?.name ?? ""}
      isAdmin={isAdmin}
      canEdit={canEdit}
      progressPct={progressPct}
      doneCount={doneCount}
      totalTasks={totalTasks}
      daysElapsed={daysElapsed}
      daysPlanned={daysPlanned}
      timelinePct={timelinePct}
      onTimePct={onTimePct}
      onTimeCount={onTimeCount}
      lateCount={lateCount}
      teamMembers={teamMembers}
    />
  );
}
