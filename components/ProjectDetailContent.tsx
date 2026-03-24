"use client";

import Link from "next/link";
import type { PipelineItem } from "@/lib/pipeline";
import { useLanguage } from "@/contexts/LanguageContext";
import TaskBoard from "@/components/TaskBoard";
import ProjectDetailActions from "@/components/ProjectDetailActions";
import ProjectAttachments from "@/components/ProjectAttachments";
import type { Task } from "@/lib/tasks";
import type { Subtask } from "@/lib/subtasks";
import Avatar from "@/components/Avatar";

// ─── Sub-component ────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200 font-medium">{value}</span>
    </div>
  );
}

// ─── Member roles (static mock data) ──────────────────────────────────────────

const MEMBER_ROLES: Record<string, string> = {
  "Alice Johnson": "Lead Engineer",
  "Bob Smith":     "Backend Developer",
  "Carol White":   "Frontend Developer",
  "Dan Torres":    "Full Stack Developer",
  "Eva Chen":      "Senior Engineer",
};

function memberInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_BADGE_STYLE: Record<string, { bg: string; dot: string }> = {
  opportunity:        { bg: "bg-indigo-500/20 text-indigo-400",  dot: "bg-indigo-400"  },
  ideation:           { bg: "bg-violet-500/20 text-violet-400",  dot: "bg-violet-400"  },
  technical_design:   { bg: "bg-blue-500/20 text-blue-400",      dot: "bg-blue-400"    },
  active_development: { bg: "bg-amber-500/20 text-amber-400",    dot: "bg-amber-400"   },
  release:            { bg: "bg-purple-500/20 text-purple-400",  dot: "bg-purple-400"  },
  iteration:          { bg: "bg-cyan-500/20 text-cyan-400",      dot: "bg-cyan-400"    },
  clean_up:           { bg: "bg-rose-500/20 text-rose-400",      dot: "bg-rose-400"    },
  completed:          { bg: "bg-green-500/20 text-green-400",    dot: "bg-green-400"   },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  item:             PipelineItem;
  tasks:            Task[];
  initialSubtasks:  Record<string, Subtask[]>;
  userNames:        string[];
  squads:        string[];
  currentUser:   string;
  isAdmin:       boolean;
  canEdit:       boolean;
  // Pre-computed metrics
  progressPct:   number;
  doneCount:     number;
  totalTasks:    number;
  daysElapsed:   number;
  daysPlanned:   number | null;
  timelinePct:   number;
  onTimePct:     number | null;
  onTimeCount:   number;
  lateCount:     number;
  teamMembers:   string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectDetailContent({
  item,
  tasks,
  initialSubtasks,
  userNames,
  squads,
  currentUser,
  isAdmin,
  canEdit,
  progressPct,
  doneCount,
  totalTasks,
  daysElapsed,
  daysPlanned,
  timelinePct,
  onTimePct,
  onTimeCount,
  lateCount,
  teamMembers,
}: Props) {
  const { t } = useLanguage();

  const statusStyle = STATUS_BADGE_STYLE[item.status] ?? {
    bg:  "bg-slate-800 text-slate-400",
    dot: "bg-slate-400",
  };

  // Translated stage labels
  const STAGE_LABELS: Record<string, string> = {
    opportunity:        t.pipeline.stages.opportunity,
    ideation:           t.pipeline.stages.ideation,
    technical_design:   t.pipeline.stages.technicalDesign,
    active_development: t.pipeline.stages.activeDevelopment,
    release:            t.pipeline.stages.release,
    iteration:          t.pipeline.stages.iteration,
    clean_up:           t.pipeline.stages.cleanUp,
    completed:          t.pipeline.stages.completed,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-slate-500 mb-4">
          <Link href="/pipeline" className="hover:text-primary transition-colors">
            {t.nav.pipeline}
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-slate-300 truncate">{item.title}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          {/* Title + status */}
          <div className="flex items-start gap-3 min-w-0">
            <h1 className="text-2xl font-bold text-white leading-snug">{item.title}</h1>
            <span
              className={`shrink-0 mt-1 flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${statusStyle.bg}`}
            >
              <span className={`size-1.5 rounded-full animate-pulse ${statusStyle.dot}`} />
              {STAGE_LABELS[item.status] ?? item.status}
            </span>
          </div>

          {/* Action buttons */}
          <ProjectDetailActions item={item} squads={squads} isAdmin={isAdmin} />
        </div>

        {item.description && (
          <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      {/* ── 3-column grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Left column (2/3) ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">

            {/* ── Overall Progress (compact) ───────────────────────────────────────── */}
            <div className="bg-primary/5 rounded-xl border border-primary/20 p-3 flex items-center gap-3">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[18px]">donut_large</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide leading-none mb-1">{t.projectDetail.overallProgress}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-white leading-none">{progressPct}%</span>
                  <span className="text-[10px] text-slate-500">{doneCount}/{totalTasks} {t.projectDetail.milestones}</span>
                </div>
                <div className="mt-1.5 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>

            {/* ── Lead Time (compact) ──────────────────────────────────────────── */}
            <div className="bg-primary/5 rounded-xl border border-primary/20 p-3 flex items-center gap-3">
              <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-amber-400 text-[18px]">timer</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide leading-none mb-1">{t.projectDetail.leadTime}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-white leading-none">{daysElapsed}</span>
                  <span className="text-[10px] text-slate-500">{t.common.days}{daysPlanned ? ` · ${t.projectDetail.ofPlanned.replace("{n}", String(daysPlanned))}` : ""}</span>
                </div>
                <div className="mt-1.5 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${timelinePct >= 100 ? "bg-red-400" : timelinePct >= 80 ? "bg-amber-400" : "bg-primary"}`}
                    style={{ width: `${Math.min(timelinePct, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ── On-Time Delivery (compact) ───────────────────────────────────── */}
            <div className="bg-primary/5 rounded-xl border border-primary/20 p-3 flex items-center gap-3">
              <div className="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">verified</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide leading-none mb-1">{t.projectDetail.onTimeDelivery}</p>
                {onTimePct !== null ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-lg font-bold leading-none ${onTimePct >= 80 ? "text-emerald-400" : onTimePct >= 60 ? "text-amber-400" : "text-red-400"}`}>{onTimePct}%</span>
                      <span className="text-[10px] text-slate-500">{onTimeCount} {t.projectDetail.onTime} · {lateCount} {t.projectDetail.late}</span>
                    </div>
                    <div className="mt-1.5 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${onTimePct}%` }} />
                    </div>
                  </>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-slate-500 leading-none">—</span>
                    <span className="text-[10px] text-slate-500">{t.projectDetail.noTasksWithDates}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="mt-6 pt-6 border-t border-primary/10">
            <div className="flex items-center gap-3 mb-5">
              <span className="material-symbols-outlined text-primary text-[20px]">view_kanban</span>
              <div>
                <h2 className="text-sm font-bold text-slate-200">{t.projectDetail.taskBoard}</h2>
                <p className="text-xs text-slate-500">{t.projectDetail.taskBoardSubtitle}</p>
              </div>
            </div>
            <TaskBoard
              initialTasks={tasks}
              initialSubtasks={initialSubtasks}
              projectId={item.id}
              users={userNames}
              project={{
                start_date:      item.start_date,
                target_end_date: item.target_end_date,
                status:          item.status,
              }}
              currentUser={currentUser}
              canEdit={canEdit}
              projectSquad={item.squad}
              hideMetrics={true}
            />
          </div>
        </div>

        {/* ─── Right column (1/3) ─────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Project Team */}
          <div className="bg-primary/5 rounded-xl border border-primary/20 overflow-hidden">
            <div className="px-5 py-4 border-b border-primary/20">
              <h3 className="text-sm font-bold text-slate-200">{t.projectDetail.team}</h3>
            </div>
            <div className="divide-y divide-primary/10">
              {teamMembers.length > 0 ? (
                teamMembers.map((member, i) => (
                  <div key={member} className="px-5 py-3 flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {memberInitials(member)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200">{member}</p>
                      <p className="text-[10px] text-slate-500">
                        {MEMBER_ROLES[member] ?? "Developer"}
                      </p>
                    </div>
                    <span
                      className={`size-2 rounded-full shrink-0 ${i === 0 ? "bg-green-500" : "bg-slate-600"}`}
                      title={i === 0 ? t.common.online : t.common.offline}
                    />
                  </div>
                ))
              ) : (
                <div className="px-5 py-4 text-sm text-slate-500">{t.projectDetail.noSquad}</div>
              )}
            </div>
          </div>

          {/* Project Details */}
          <div className="bg-primary/5 rounded-xl border border-primary/20 overflow-hidden">
            <div className="px-5 py-4 border-b border-primary/20">
              <h3 className="text-sm font-bold text-slate-200">{t.projectDetail.details}</h3>
            </div>
            <div className="px-5 py-4 space-y-3">
              <DetailRow label={t.projectDetail.lead}      value={item.created_by}     />
              <DetailRow label={t.projectDetail.squad}     value={item.squad || "—"}   />
              <DetailRow label={t.projectDetail.start}     value={formatDate(item.start_date)} />
              <DetailRow label={t.projectDetail.targetEnd} value={formatDate(item.target_end_date)} />
              {item.completion_date && (
                <DetailRow label={t.projectDetail.completedDate} value={formatDate(item.completion_date)} />
              )}
            </div>
          </div>

          {/* Project Documentation */}
          <div className="bg-primary/5 rounded-xl border border-primary/20 overflow-hidden">
            <div className="px-5 py-4 border-b border-primary/20">
              <h3 className="text-sm font-bold text-slate-200">{t.projectDetail.documentation}</h3>
            </div>
            {(item.prd_url || item.odd_url || item.trd_url) ? (
              <div className="px-5 py-4 space-y-3">
                {item.prd_url && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="material-symbols-outlined text-[15px]">description</span>
                      PRD
                    </div>
                    <a href={item.prd_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                      {t.common.open}
                    </a>
                  </div>
                )}
                {item.odd_url && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="material-symbols-outlined text-[15px]">article</span>
                      ODD
                    </div>
                    <a href={item.odd_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                      {t.common.open}
                    </a>
                  </div>
                )}
                {item.trd_url && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="material-symbols-outlined text-[15px]">engineering</span>
                      TRD
                    </div>
                    <a href={item.trd_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                      {t.common.open}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-5 py-5 text-center">
                <span className="material-symbols-outlined text-slate-600 text-[24px] block mb-1.5">folder_off</span>
                <p className="text-xs text-slate-500">{t.projectDetail.noDocs}</p>
              </div>
            )}
          </div>

          {/* Additional Documents (attachments) */}
          <ProjectAttachments
            projectId={item.id}
            initialAttachments={item.attachments ?? []}
            currentUser={currentUser}
            isAdmin={isAdmin}
            canEdit={canEdit}
          />

          {/* Activity Feed */}
          <div className="bg-primary/5 rounded-xl border border-primary/20 overflow-hidden">
            <div className="px-5 py-4 border-b border-primary/20">
              <h3 className="text-sm font-bold text-slate-200">{t.projectDetail.activity}</h3>
            </div>
            <div className="px-5 py-4 space-y-4">
              {[
                {
                  icon:  "rocket_launch",
                  text:  `${t.projectDetail.activityStatus} ${STAGE_LABELS[item.status] ?? item.status}`,
                  time:  t.projectDetail.activity2hAgo,
                  color: "text-primary",
                },
                {
                  icon:  "add_task",
                  text:  `${t.projectDetail.activityTask} ${item.created_by}`,
                  time:  t.projectDetail.activity1dAgo,
                  color: "text-emerald-400",
                },
                {
                  icon:  "description",
                  text:  t.projectDetail.activityPrd,
                  time:  t.projectDetail.activity3dAgo,
                  color: "text-slate-400",
                },
              ].map((entry, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ${entry.color}`}>
                    <span className="material-symbols-outlined text-[14px]">{entry.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 leading-relaxed">{entry.text}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{entry.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
