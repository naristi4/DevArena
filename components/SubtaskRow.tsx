"use client";

import { useState } from "react";
import type { Subtask, SubtaskStatus } from "@/lib/subtasks";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_BADGE: Record<SubtaskStatus, { bg: string; text: string }> = {
  todo:                  { bg: "bg-slate-700",        text: "text-slate-300"  },
  in_progress:           { bg: "bg-amber-500/20",     text: "text-amber-300"  },
  ready_to_be_deployed:  { bg: "bg-blue-500/20",      text: "text-blue-300"   },
  done:                  { bg: "bg-emerald-500/20",   text: "text-emerald-400"},
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  subtask:       Subtask;
  users:         string[];
  canEditAll:    boolean;    // admin — can edit title and description
  canEditStatus: boolean;    // admin or assignee — can change status/assignee
  isAdmin:       boolean;    // controls delete button visibility
  onUpdate:      (updated: Subtask) => void;
  onDelete:      (subtaskId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubtaskRow({
  subtask, users, canEditAll, canEditStatus, isAdmin, onUpdate, onDelete,
}: Props) {
  const { t } = useLanguage();
  const st = t.subtasks;

  const [expanded,       setExpanded]       = useState(false);
  const [editingTitle,   setEditingTitle]   = useState(false);
  const [localTitle,     setLocalTitle]     = useState(subtask.title);
  const [showDelConfirm, setShowDelConfirm] = useState(false);

  const badge = STATUS_BADGE[subtask.status];

  const statusLabels: Record<SubtaskStatus, string> = {
    todo:                 st.todo,
    in_progress:          st.inProgress,
    ready_to_be_deployed: st.readyToDeploy,
    done:                 st.done,
  };

  function cycleStatus() {
    if (!canEditStatus) return;
    const order: SubtaskStatus[] = ["todo", "in_progress", "ready_to_be_deployed", "done"];
    const next = order[(order.indexOf(subtask.status) + 1) % order.length];
    onUpdate({ ...subtask, status: next });
  }

  function commitTitle() {
    setEditingTitle(false);
    if (localTitle.trim() && localTitle.trim() !== subtask.title) {
      onUpdate({ ...subtask, title: localTitle.trim() });
    } else {
      setLocalTitle(subtask.title);
    }
  }

  // First name only for compact display
  const assigneeFirstName = subtask.assigned_user.split(" ")[0];

  return (
    <div className="group rounded-lg border border-primary/10 bg-slate-800/40 overflow-hidden">

      {/* ── Main row ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2">

        {/* Status badge — click to cycle */}
        <button
          onClick={cycleStatus}
          disabled={!canEditStatus}
          title={canEditStatus ? `Click to change status (${statusLabels[subtask.status]})` : statusLabels[subtask.status]}
          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold leading-none whitespace-nowrap
            ${badge.bg} ${badge.text}
            ${canEditStatus ? "cursor-pointer hover:brightness-125 transition-all" : "cursor-default"}`}
        >
          {statusLabels[subtask.status]}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          {editingTitle && canEditAll ? (
            <input
              autoFocus
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter")  commitTitle();
                if (e.key === "Escape") { setLocalTitle(subtask.title); setEditingTitle(false); }
              }}
              className="w-full bg-slate-700 border border-primary/30 rounded px-2 py-0.5 text-xs text-slate-200 outline-none focus:border-primary/60"
            />
          ) : (
            <span
              className={`text-xs leading-snug block truncate
                ${subtask.status === "done" ? "line-through text-slate-500" : subtask.status === "ready_to_be_deployed" ? "text-blue-200" : "text-slate-200"}
                ${canEditAll ? "cursor-text hover:text-white" : ""}`}
              onDoubleClick={() => canEditAll && setEditingTitle(true)}
              title={canEditAll ? `${subtask.title} (double-click to edit)` : subtask.title}
            >
              {subtask.title}
            </span>
          )}
        </div>

        {/* Assignee */}
        <span className="text-[11px] text-slate-500 shrink-0">
          — {assigneeFirstName}
        </span>

        {/* Expand toggle (only when there's something to edit) */}
        {(canEditAll || canEditStatus) && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-slate-600 hover:text-slate-300 transition-colors shrink-0"
          >
            <span className={`material-symbols-outlined text-[14px] transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>
        )}

        {/* Delete (admin, appears on hover) */}
        {isAdmin && (
          <button
            onClick={() => setShowDelConfirm(true)}
            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all shrink-0"
            title={st.deleteSubtask}
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
          </button>
        )}
      </div>

      {/* ── Expanded edit panel ───────────────────────────────────────────────── */}
      <div className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="px-3 pb-3 pt-2 space-y-2 border-t border-primary/10">

            {/* Status select */}
            {canEditStatus && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 w-16 shrink-0">Status</span>
                <select
                  value={subtask.status}
                  onChange={(e) => onUpdate({ ...subtask, status: e.target.value as SubtaskStatus })}
                  className="flex-1 bg-slate-700 border border-primary/20 rounded px-2 py-0.5 text-xs text-slate-200 outline-none focus:border-primary/40"
                >
                  <option value="todo">{st.todo}</option>
                  <option value="in_progress">{st.inProgress}</option>
                  <option value="ready_to_be_deployed">{st.readyToDeploy}</option>
                  <option value="done">{st.done}</option>
                </select>
              </div>
            )}

            {/* Assignee select */}
            {canEditStatus && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 w-16 shrink-0">{st.assignedTo}</span>
                <select
                  value={subtask.assigned_user}
                  onChange={(e) => onUpdate({ ...subtask, assigned_user: e.target.value })}
                  className="flex-1 bg-slate-700 border border-primary/20 rounded px-2 py-0.5 text-xs text-slate-200 outline-none focus:border-primary/40"
                >
                  {users.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Description */}
            {canEditAll && (
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500">{st.description}</span>
                <textarea
                  value={subtask.description}
                  onChange={(e) => onUpdate({ ...subtask, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-700 border border-primary/20 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-primary/40 resize-none"
                />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Delete confirmation ───────────────────────────────────────────────── */}
      {showDelConfirm && (
        <div className="px-3 py-2 bg-red-950/40 border-t border-red-500/20 flex items-center justify-between gap-2">
          <p className="text-xs text-red-300">Delete this subtask?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDelConfirm(false)}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              {st.cancel}
            </button>
            <button
              onClick={() => onDelete(subtask.id)}
              className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              {st.deleteSubtask}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
