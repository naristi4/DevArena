"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getDeveloperLeaderboard, getSquadLeaderboard } from "@/lib/gamification";
import type { DeveloperScore, SquadScore } from "@/lib/gamification";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the ISO date (YYYY-MM-DD) of the most-recent Monday (today if Monday). */
function getLastMondayStr(): string {
  const today = new Date();
  const dow = today.getDay(); // 0 = Sunday
  const offset = dow === 0 ? 6 : dow - 1;
  const mon = new Date(today);
  mon.setDate(today.getDate() - offset);
  return mon.toISOString().slice(0, 10);
}

/** "Mar 2 – Mar 8" style label for the evaluated week (Mon → previous Sun). */
function getWeekLabel(lastMondayStr: string): string {
  const mon = new Date(lastMondayStr + "T00:00:00");
  const prevMon = new Date(mon);
  prevMon.setDate(mon.getDate() - 7);
  const prevSun = new Date(mon);
  prevSun.setDate(mon.getDate() - 1);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(prevMon)} – ${fmt(prevSun)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeeklyAwardsModal() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [topSquad,  setTopSquad]  = useState<SquadScore  | null>(null);
  const [topDev,    setTopDev]    = useState<DeveloperScore | null>(null);
  const [weekLabel, setWeekLabel] = useState("");

  useEffect(() => {
    // Wait until session has loaded
    if (status === "loading") return;

    const userName    = session?.user?.name ?? "anonymous";
    const lastMonday  = getLastMondayStr();
    const storageKey  = `weeklyAwardsModal_${userName}_${lastMonday}`;

    // Already seen this week → do nothing
    if (localStorage.getItem(storageKey) === "seen") return;

    const squad = getSquadLeaderboard(true)[0]  ?? null;
    const dev   = getDeveloperLeaderboard(true)[0] ?? null;

    // No data yet → skip
    if (!squad && !dev) return;

    setTopSquad(squad);
    setTopDev(dev);
    setWeekLabel(getWeekLabel(lastMonday));
    setVisible(true);
  }, [status, session]);

  function dismiss() {
    const userName   = session?.user?.name ?? "anonymous";
    const lastMonday = getLastMondayStr();
    localStorage.setItem(`weeklyAwardsModal_${userName}_${lastMonday}`, "seen");
    setVisible(false);
  }

  function viewLeaderboard() {
    dismiss();
    router.push("/leaderboard");
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-slate-900 border border-primary/20 rounded-2xl shadow-2xl overflow-hidden">

        {/* Subtle top gradient accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500/60 via-primary/60 to-amber-500/60" />

        <div className="px-8 py-8 flex flex-col items-center text-center gap-6">

          {/* Trophy icon */}
          <div className="size-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <span className="material-symbols-outlined text-amber-400 text-[36px]">emoji_events</span>
          </div>

          {/* Title + week */}
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white tracking-tight">
              🏆 DevArena Weekly Awards
            </h2>
            {weekLabel && (
              <p className="text-xs text-slate-500">Week of {weekLabel}</p>
            )}
          </div>

          {/* Winner cards */}
          <div className="w-full flex flex-col gap-3">

            {/* Top Squad */}
            {topSquad && (
              <div className="bg-amber-500/8 border border-amber-500/25 rounded-xl px-5 py-4 text-left flex items-center gap-4">
                <div className="size-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-amber-400 text-[20px]">groups</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-amber-400/80 uppercase tracking-wider mb-0.5">
                    🥇 Top Squad
                  </p>
                  <p className="text-base font-black text-white leading-tight">{topSquad.squad}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{topSquad.totalPoints} pts · {topSquad.tasks} tasks</p>
                </div>
              </div>
            )}

            {/* MVP Developer */}
            {topDev && (
              <div className="bg-primary/8 border border-primary/25 rounded-xl px-5 py-4 text-left flex items-center gap-4">
                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-primary/80 uppercase tracking-wider mb-0.5">
                    👑 MVP Developer
                  </p>
                  <p className="text-base font-black text-white leading-tight">{topDev.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{topDev.totalPoints} pts · {topDev.squad}</p>
                </div>
              </div>
            )}
          </div>

          {/* Congrats + subtext */}
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-200">👏 Congratulations!</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              The results are in! Check the leaderboard to see the full rankings.
            </p>
          </div>

          {/* Actions */}
          <div className="w-full flex flex-col gap-2.5">
            <button
              onClick={viewLeaderboard}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
            >
              View Leaderboard
            </button>
            <button
              onClick={dismiss}
              className="w-full py-2.5 rounded-lg text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors hover:bg-primary/5"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
