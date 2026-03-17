"use client";

import { useState } from "react";
import {
  getDeveloperLeaderboard,
  getSquadLeaderboard,
  SCORING,
  type DeveloperScore,
  type SquadScore,
} from "@/lib/gamification";
import Avatar from "@/components/Avatar";
import { useLanguage } from "@/contexts/LanguageContext";

/** Returns the Mon–Sun range of the last fully-completed week.
 *  Refreshes every Monday: Mon Mar 9 → evaluated week = Mar 2–8. */
function getEvaluatedWeekRange(): string {
  const today        = new Date();
  const dow          = today.getDay();                   // 0=Sun … 6=Sat
  const sinceMonday  = dow === 0 ? 6 : dow - 1;
  const thisMonday   = new Date(today);
  thisMonday.setDate(today.getDate() - sinceMonday);
  const prevMonday   = new Date(thisMonday);
  prevMonday.setDate(thisMonday.getDate() - 7);
  const prevSunday   = new Date(thisMonday);
  prevSunday.setDate(thisMonday.getDate() - 1);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(prevMonday)} – ${fmt(prevSunday)}`;
}

type FilterTab = "weekly" | "monthly" | "all";

// ─── Component ────────────────────────────────────────────────────────────────

export default function GamificationDashboard() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterTab>("weekly");

  const weekOnly   = filter === "weekly";
  const developers = getDeveloperLeaderboard(weekOnly);
  const squads     = getSquadLeaderboard(weekOnly);

  // ── Weekly squad metrics (always week-only, independent of the filter tabs) ─
  const weeklySquads        = weekOnly ? squads : getSquadLeaderboard(true);
  const topSquadOfWeek      = weeklySquads[0] ?? null;
  const fastestSquadOfWeek  = [...weeklySquads].sort((a, b) => b.onTimeCount - a.onTimeCount)[0] ?? null;
  const totalWeeklyTasks    = weeklySquads.reduce((sum, s) => sum + s.tasks, 0);
  const weekRange           = getEvaluatedWeekRange();

  return (
    <>
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-white">{t.leaderboard.title}</h1>
      <p className="mt-1 text-sm text-slate-400 max-w-2xl">{t.leaderboard.subtitle}</p>
    </div>
    <div className="flex gap-6">

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-8">

        {/* ── Weekly Squad Metrics ────────────────────────────────────────── */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {t.leaderboard.weekEvaluated}{" "}
            <span className="text-slate-400 normal-case font-medium">{weekRange}</span>
            <span className="text-slate-600 normal-case font-normal"> {t.leaderboard.mondaySunday}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SquadWeeklyCard
              icon="emoji_events"
              iconBg="bg-amber-500/10 text-amber-400"
              title={t.leaderboard.topSquad}
              primaryValue={topSquadOfWeek?.squad ?? "—"}
              secondaryValue={`${topSquadOfWeek?.totalPoints ?? 0} ${t.leaderboard.pts} this week`}
              highlighted
            />
            <SquadWeeklyCard
              icon="bolt"
              iconBg="bg-blue-500/10 text-blue-400"
              title={t.leaderboard.fastestSquad}
              primaryValue={fastestSquadOfWeek?.squad ?? "—"}
              secondaryValue={`${fastestSquadOfWeek?.onTimeCount ?? 0} tasks on time`}
            />
            <SquadWeeklyCard
              icon="task_alt"
              iconBg="bg-violet-500/10 text-violet-400"
              title={t.leaderboard.tasksCompleted}
              primaryValue={String(totalWeeklyTasks)}
              secondaryValue={t.leaderboard.thisWeek}
              largeValue
            />
          </div>
        </div>

        {/* ── Podium spotlight ────────────────────────────────────────────── */}
        {developers.length >= 3 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6">
              {t.leaderboard.topDevs}
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {/* Silver — #2 (left) */}
              <PodiumCard dev={developers[1]} position={2} />

              {/* Gold — #1 (center, elevated) */}
              <div className="flex flex-col items-center gap-3 -mt-4">
                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] font-black text-amber-400 uppercase tracking-widest">
                  MVP Week
                </div>
                <PodiumCard dev={developers[0]} position={1} elevated />
              </div>

              {/* Bronze — #3 (right) */}
              <PodiumCard dev={developers[2]} position={3} />
            </div>
          </div>
        )}

        {/* ── Global Standings ────────────────────────────────────────────── */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl overflow-hidden">
          {/* Header + tabs */}
          <div className="px-6 py-4 border-b border-primary/20 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200">Global Standings</h2>
            <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg">
              {(["weekly", "monthly", "all"] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    filter === tab
                      ? "bg-primary text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab === "all" ? "All Time" : tab === "weekly" ? "Weekly" : "Monthly"}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase text-slate-500 font-bold border-b border-primary/10">
                  <th className="px-6 py-3">Rank</th>
                  <th className="px-6 py-3">Developer</th>
                  <th className="px-6 py-3">Squad</th>
                  <th className="px-6 py-3">Tasks Done</th>
                  <th className="px-6 py-3">Delays</th>
                  <th className="px-6 py-3 text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {developers.map((dev) => {
                  return (
                    <tr
                      key={dev.name}
                      className="hover:bg-primary/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-400">#{dev.rank}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Avatar name={dev.name} size="size-7" textSize="text-[10px]" />
                          <span className="text-sm font-semibold text-slate-200">
                            {dev.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-400">{dev.squad}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-emerald-400">
                          +{dev.tasks}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-sm font-semibold ${
                            dev.delayed > 0 ? "text-red-400" : "text-slate-500"
                          }`}
                        >
                          {dev.delayed > 0 ? `-${dev.delayed}` : "0"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-primary">
                          {dev.totalPoints}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">XP</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── How Points Work ─────────────────────────────────────────────── */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">info</span>
            How Points Work
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <RuleCard
              icon="task_alt"
              iconCls="text-emerald-400"
              label="Complete a task"
              pts={`+${SCORING.TASK_COMPLETE}`}
              ptsColor="text-emerald-400"
            />
            <RuleCard
              icon="bolt"
              iconCls="text-primary"
              label="On time completion (task finished within estimated time)"
              pts={`+${SCORING.ON_TIME_BONUS}`}
              ptsColor="text-primary"
            />
            <RuleCard
              icon="schedule"
              iconCls="text-red-400"
              label="Delayed (actual > estimated)"
              pts={`${SCORING.DELAY_PENALTY}`}
              ptsColor="text-red-400"
              note="Not applied in Iteration"
            />
            <RuleCard
              icon="bug_report"
              iconCls="text-red-400"
              label="Per open bug (squad)"
              pts={`${SCORING.BUG_PENALTY}`}
              ptsColor="text-red-400"
              note="Applied to squad total"
            />
          </div>
        </div>
      </div>

      {/* ── Right sidebar ─────────────────────────────────────────────────── */}
      <div className="hidden xl:flex w-80 shrink-0 flex-col gap-6">

        {/* Live Activity */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-200">Live Activity</h3>
          </div>
          <div className="space-y-4">
            {[
              {
                icon:    "task_alt",
                iconCls: "text-emerald-400",
                text:    'Alice J. completed "Setup Auth Service"',
                xp:      "+15 XP",
                xpColor: "text-emerald-400",
                time:    "2m ago",
              },
              {
                icon:    "merge",
                iconCls: "text-primary",
                text:    'Bob S. merged "Payments Refactor"',
                xp:      "+10 XP",
                xpColor: "text-primary",
                time:    "8m ago",
              },
              {
                icon:    "bug_report",
                iconCls: "text-red-400",
                text:    'Eva C. opened bug "Payment Duplicate"',
                xp:      "-5 XP",
                xpColor: "text-red-400",
                time:    "15m ago",
              },
            ].map((entry, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className={`size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ${entry.iconCls}`}
                >
                  <span className="material-symbols-outlined text-[14px]">{entry.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 leading-relaxed">{entry.text}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-slate-500">{entry.time}</span>
                    <span className={`text-[10px] font-bold ${entry.xpColor}`}>{entry.xp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekend Sprint promo */}
        <div className="relative bg-gradient-to-br from-background-dark to-primary/20 border border-primary/30 rounded-2xl p-6 overflow-hidden">
          {/* Decorative background icon */}
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[80px] text-primary/10 pointer-events-none select-none">
            rocket_launch
          </span>
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
              <h3 className="text-sm font-black text-white">Weekend Sprint</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Earn{" "}
              <span className="text-primary font-bold">2× points</span>{" "}
              on all tasks completed this weekend. Top performers unlock exclusive badges!
            </p>
            <button className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              Join Sprint
            </button>
          </div>
        </div>

        {/* Squad Rankings sidebar panel */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-200 mb-4">Squad Rankings</h3>
          <div className="space-y-4">
            {squads.map((sq) => (
              <div key={sq.squad} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">#{sq.rank}</span>
                    <span className="text-sm font-semibold text-slate-200">{sq.squad}</span>
                  </div>
                  <span className="text-xs font-black text-primary">{sq.totalPoints} XP</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${sq.onTimeRate}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  {sq.onTimeRate}% on-time · {sq.tasks} tasks · {sq.memberCount} members
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

// ─── Hero Stat Card ────────────────────────────────────────────────────────────

function HeroStatCard({
  icon,
  iconBg,
  label,
  value,
  sub,
  subColor,
  valueSmall = false,
}: {
  icon:        string;
  iconBg:      string;
  label:       string;
  value:       string;
  sub:         string;
  subColor:    string;
  valueSmall?: boolean;
}) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
        <p className={`font-black text-white truncate ${valueSmall ? "text-lg" : "text-2xl"}`}>
          {value}
        </p>
        <p className={`text-xs mt-0.5 ${subColor}`}>{sub}</p>
      </div>
    </div>
  );
}

// ─── Squad Weekly Card ────────────────────────────────────────────────────────

function SquadWeeklyCard({
  icon,
  iconBg,
  title,
  primaryValue,
  secondaryValue,
  highlighted = false,
  largeValue  = false,
}: {
  icon:           string;
  iconBg:         string;
  title:          string;
  primaryValue:   string;
  secondaryValue: string;
  highlighted?:   boolean;
  largeValue?:    boolean;
}) {
  return (
    <div
      className={`bg-primary/5 rounded-xl p-5 flex items-start gap-4 ${
        highlighted
          ? "border-2 border-amber-500/40 shadow-sm shadow-amber-500/10"
          : "border border-primary/20"
      }`}
    >
      <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium mb-1">{title}</p>
        <p className={`font-black text-white leading-tight ${largeValue ? "text-3xl" : "text-base"}`}>
          {primaryValue}
        </p>
        <p className="text-xs mt-0.5 text-slate-400">{secondaryValue}</p>
      </div>
    </div>
  );
}

// ─── Podium Card ───────────────────────────────────────────────────────────────

function PodiumCard({
  dev,
  position,
  elevated = false,
}: {
  dev:       DeveloperScore;
  position:  1 | 2 | 3;
  elevated?: boolean;
}) {
  const ringCls =
    position === 1
      ? "ring-4 ring-yellow-500/40"
      : position === 2
      ? "ring-4 ring-slate-400/30"
      : "ring-4 ring-amber-700/30";

  const badgeBg =
    position === 1
      ? "bg-yellow-400 text-black"
      : position === 2
      ? "bg-slate-300 text-black"
      : "bg-amber-700 text-white";

  const cardBorder =
    position === 1
      ? "border-2 border-yellow-500/30"
      : "border border-primary/20";

  const textSize   = elevated ? "text-base"         : "text-sm";
  const xpSize     = elevated ? "text-2xl"          : "text-lg";

  return (
    <div
      className={`flex flex-col items-center gap-3 bg-primary/5 rounded-xl p-4 ${cardBorder} ${
        elevated ? "scale-105 shadow-lg shadow-primary/10" : ""
      } transition-all`}
    >
      {/* Avatar with rank badge */}
      <div className="relative">
        <Avatar
          name={dev.name}
          size={elevated ? "size-16" : "size-12"}
          textSize={elevated ? "text-base" : "text-xs"}
          className={ringCls}
        />
        <span
          className={`absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center text-[10px] font-black ${badgeBg}`}
        >
          {position}
        </span>
      </div>

      {/* Name + squad */}
      <div className="text-center">
        <p className={`font-bold text-slate-200 ${textSize}`}>
          {dev.name.split(" ")[0]}
        </p>
        <p className="text-[10px] text-slate-500">{dev.squad}</p>
      </div>

      {/* XP + tasks */}
      <div className="text-center">
        <p className={`font-black text-primary ${xpSize}`}>{dev.totalPoints}</p>
        <p className="text-[10px] text-slate-500">XP · {dev.tasks} tasks</p>
      </div>
    </div>
  );
}

// ─── Rule Card ────────────────────────────────────────────────────────────────

function RuleCard({
  icon,
  iconCls,
  label,
  pts,
  ptsColor,
  note,
}: {
  icon:     string;
  iconCls:  string;
  label:    string;
  pts:      string;
  ptsColor: string;
  note?:    string;
}) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className={`material-symbols-outlined text-[20px] ${iconCls}`}>{icon}</span>
        <span className={`text-base font-black ${ptsColor}`}>{pts}</span>
      </div>
      <p className="text-xs font-medium text-slate-300 leading-snug">{label}</p>
      {note && <p className="text-[10px] text-slate-500 leading-snug">{note}</p>}
    </div>
  );
}
