import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMockPipelineItems } from "@/lib/pipeline";
import { MOCK_TASKS } from "@/lib/tasks";
import { MOCK_SQUADS } from "@/lib/squads";
import { prisma } from "@/lib/prisma";
import { getSquadLeaderboard } from "@/lib/gamification";
import ProjectDetailContent from "@/components/ProjectDetailContent";

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

  const { id }  = await params;
  const item     = getMockPipelineItems().find((p) => p.id === id);
  if (!item) notFound();

  const tasks    = MOCK_TASKS.filter((t) => t.project_id === id);
  const userNames = (await prisma.user.findMany({ select: { name: true }, orderBy: { name: "asc" } })).map((u) => u.name);
  const squads   = MOCK_SQUADS.map((s) => s.name);

  // ── Edit permission ───────────────────────────────────────────────────────
  const userSquad = (session.user as any).squad as string | undefined;
  const userRole  = (session.user as any).role  as string | undefined;
  const isAdmin   = userRole === "Admin";
  const canEdit   = isAdmin || (!!item.squad && item.squad === userSquad);

  // ── Metrics (server-side) ─────────────────────────────────────────────────
  const totalTasks   = tasks.length;
  const doneCount    = tasks.filter((t) => t.status === "done").length;
  const progressPct  = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  const today     = new Date();
  const startDate = item.start_date ? new Date(item.start_date + "T00:00:00") : null;
  const endDate   = item.target_end_date
    ? new Date(item.target_end_date + "T00:00:00")
    : null;

  const daysElapsed = startDate
    ? Math.max(Math.floor((today.getTime() - startDate.getTime()) / MS_DAY), 0)
    : 0;
  const daysPlanned = startDate && endDate
    ? Math.max(Math.floor((endDate.getTime() - startDate.getTime()) / MS_DAY), 1)
    : null;
  const timelinePct = daysPlanned
    ? Math.min(Math.round((daysElapsed / daysPlanned) * 100), 100)
    : 0;

  // On-time delivery metrics
  const doneWithDates = tasks.filter((t) => t.status === "done" && t.target_end_date && t.completion_date && t.type !== "iteration");
  const onTimeCount   = doneWithDates.filter((t) => t.completion_date! <= t.target_end_date!).length;
  const lateCount     = doneWithDates.length - onTimeCount;
  const onTimePct     = doneWithDates.length > 0
    ? Math.round((onTimeCount / doneWithDates.length) * 100)
    : null;

  // Team members from squad leaderboard
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
