"use client";

import { useState } from "react";
import PipelineBoard   from "@/components/PipelineBoard";
import ActiveTasksBoard from "@/components/ActiveTasksBoard";
import type { PipelineItem } from "@/lib/pipeline";
import type { ActiveTask }   from "@/components/ActiveTasksBoard";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "pipeline" | "active_tasks";

interface Props {
  initialItems: PipelineItem[];
  activeTasks:  ActiveTask[];
  squads:       string[];
  users:        string[];
  currentUser:  string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PipelineShell({
  initialItems,
  activeTasks,
  squads,
  users,
  currentUser,
}: Props) {
  const [tab, setTab] = useState<Tab>("pipeline");

  // Total tasks currently in-flight (for the badge on the Active Tasks tab)
  const inFlightCount = activeTasks.length;

  return (
    <div className="space-y-6">

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-primary/5 border border-primary/20 rounded-xl w-fit">

        <button
          onClick={() => setTab("pipeline")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === "pipeline"
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-primary/10"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">view_kanban</span>
          Product Pipeline
        </button>

        <button
          onClick={() => setTab("active_tasks")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === "active_tasks"
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-primary/10"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">bolt</span>
          Active Tasks
          {inFlightCount > 0 && (
            <span
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full tabular-nums ${
                tab === "active_tasks"
                  ? "bg-white/20 text-white"
                  : "bg-primary/20 text-primary"
              }`}
            >
              {inFlightCount}
            </span>
          )}
        </button>

      </div>

      {/* ── Active view ────────────────────────────────────────────────────── */}
      {tab === "pipeline" ? (
        <PipelineBoard
          initialItems={initialItems}
          squads={squads}
          currentUser={currentUser}
        />
      ) : (
        <ActiveTasksBoard
          initialTasks={activeTasks}
          squads={squads}
          users={users}
          currentUser={currentUser}
        />
      )}

    </div>
  );
}
