"use client";

import { useEffect, useRef, useState } from "react";
import type { Task, TaskStatus, TaskType, TaskPriority } from "@/lib/tasks";
import { useNotifications } from "@/components/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Avatar from "@/components/Avatar";
import type { Subtask, SubtaskStatus } from "@/lib/subtasks";
import SubtaskRow         from "@/components/SubtaskRow";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Comment {
  id:       string;
  author:   string;
  text:     string;
  at:       string;
  mentions: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "backlog",          label: "Backlog"          },
  { value: "in_progress",      label: "In Progress"      },
  { value: "review",           label: "Review"           },
  { value: "ready_to_release", label: "Ready to Release" },
  { value: "done",             label: "Done"             },
];

const TYPE_OPTIONS:     TaskType[]     = ["task", "bug", "iteration"];
const PRIORITY_OPTIONS: TaskPriority[] = ["urgent", "high", "medium", "low"];

const PRIORITY_META: Record<string, { icon: string; cls: string; label: string }> = {
  urgent: { icon: "keyboard_double_arrow_up", cls: "text-red-400",    label: "Urgent" },
  high:   { icon: "priority_high",            cls: "text-orange-400", label: "High"   },
  medium: { icon: "drag_handle",              cls: "text-green-400",  label: "Medium" },
  low:    { icon: "low_priority",             cls: "text-blue-400",   label: "Low"    },
};

const STATUS_BADGE: Record<TaskStatus, { cls: string; dot: string }> = {
  backlog:          { cls: "bg-slate-800 text-slate-400",        dot: "bg-slate-400"   },
  in_progress:      { cls: "bg-primary/20 text-primary",         dot: "bg-primary"     },
  review:           { cls: "bg-blue-500/20 text-blue-400",       dot: "bg-blue-400"    },
  ready_to_release: { cls: "bg-purple-500/20 text-purple-400",   dot: "bg-purple-400"  },
  done:             { cls: "bg-green-500/20 text-green-400",      dot: "bg-green-400"   },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

import type { Translations } from "@/locales/en";

function relativeTime(iso: string, time: Translations["time"]) {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hrs   = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)  return time.justNow;
  if (mins < 60) return `${mins}${time.minutesAgo}`;
  if (hrs  < 24) return `${hrs}${time.hoursAgo}`;
  return `${days}${time.daysAgo}`;
}

/** Highlight @Username in a comment string */
function renderCommentText(text: string, users: string[]) {
  const parts = text.split(/(@[\w]+ ?[\w]+)/g);
  return parts.map((part, i) => {
    const isMatch = users.some((u) => part.trim() === `@${u}`);
    if (isMatch) {
      return (
        <span key={i} className="text-primary font-semibold bg-primary/10 rounded px-0.5">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/** Parse @Username mentions from text, matching against known user names */
function parseMentions(text: string, users: string[]): string[] {
  const mentioned: string[] = [];
  users.forEach((u) => {
    if (text.includes(`@${u}`)) mentioned.push(u);
  });
  return mentioned;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  task:         Task;
  users:        string[];
  currentUser:  string;
  projectId:    string;
  comments:     Comment[];
  editMode:     "full" | "limited" | "readonly";
  onSave:       (updated: Task) => void;
  onAddComment: (taskId: string, comment: Comment) => void;
  onDelete?:    (taskId: string) => void;
  subtasks?:         Subtask[];
  onAddSubtask?:     (taskId: string, st: Subtask) => void;
  onUpdateSubtask?:  (st: Subtask) => void;
  onDeleteSubtask?:  (subtaskId: string, taskId: string) => void;
  onClose:      () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaskDetailModal({
  task,
  users,
  currentUser,
  projectId,
  comments,
  editMode,
  onSave,
  onAddComment,
  onDelete,
  subtasks,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onClose,
}: Props) {
  // ── Field-level permissions derived from editMode ────────────────────────
  const canEditAll     = editMode === "full";
  const canEditStatus  = editMode === "full" || editMode === "limited";
  const canSave        = editMode !== "readonly";
  const disabledCls    = "opacity-50 cursor-not-allowed";

  const { t } = useLanguage();

  const STATUS_OPTIONS_T: { value: TaskStatus; label: string }[] = [
    { value: "backlog",          label: t.tasks.statuses.backlog          },
    { value: "in_progress",      label: t.tasks.statuses.inProgress       },
    { value: "review",           label: t.tasks.statuses.review           },
    { value: "ready_to_release", label: t.tasks.statuses.readyToRelease   },
    { value: "done",             label: t.tasks.statuses.done             },
  ];

  const PRIORITY_LABELS_T: Record<string, string> = {
    urgent: t.tasks.priorities.urgent,
    high:   t.tasks.priorities.high,
    medium: t.tasks.priorities.medium,
    low:    t.tasks.priorities.low,
  };

  const TYPE_LABELS_T: Record<string, string> = {
    task:      t.tasks.types.task,
    bug:       t.tasks.types.bug,
    iteration: t.tasks.types.iteration,
  };
  // Edit state (local copy)
  const [title,       setTitle]       = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [assignedTo,  setAssignedTo]  = useState(task.assigned_to);
  const [status,      setStatus]      = useState<TaskStatus>(task.status);
  const [priority,    setPriority]    = useState<TaskPriority>(task.priority ?? "medium");
  const [taskType,    setTaskType]    = useState<TaskType>(task.type ?? "task");
  const [startDate,       setStartDate]       = useState(task.start_date        ?? "");
  const [targetEndDate,   setTargetEndDate]   = useState(task.target_end_date   ?? "");
  const [completionDate,  setCompletionDate]  = useState(task.completion_date   ?? "");
  const [isDirty,          setIsDirty]          = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting,          setDeleting]          = useState(false);

  // Subtask create form
  const [showSubtaskForm,   setShowSubtaskForm]   = useState(false);
  const [stFormTitle,       setStFormTitle]       = useState("");
  const [stFormUser,        setStFormUser]        = useState(users[0] ?? "");
  const [stFormStatus,      setStFormStatus]      = useState<SubtaskStatus>("todo");
  const [stFormDescription, setStFormDescription] = useState("");

  // Comment state
  const [commentText,    setCommentText]    = useState("");
  const [mentionQuery,   setMentionQuery]   = useState<string | null>(null);
  const [mentionFilter,  setMentionFilter]  = useState("");
  const commentRef                          = useRef<HTMLTextAreaElement>(null);

  const { addNotification } = useNotifications();

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // ── Field change helpers ────────────────────────────────────────────────
  function touch() { setIsDirty(true); }

  // ── Save edits ──────────────────────────────────────────────────────────
  function handleSave() {
    onSave({
      ...task,
      title:            title.trim() || task.title,
      description:      description.trim(),
      assigned_to:      assignedTo,
      status,
      priority,
      type:             taskType,
      start_date:       startDate       || undefined,
      target_end_date:  targetEndDate   || undefined,
      completion_date:  completionDate  || undefined,
    });
    setIsDirty(false);
  }

  function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!stFormTitle.trim() || !onAddSubtask) return;
    const newSt: Subtask = {
      id:            `st-${Date.now()}`,
      task_id:       task.id,
      title:         stFormTitle.trim(),
      description:   stFormDescription.trim(),
      status:        stFormStatus,
      assigned_user: stFormUser || (users[0] ?? ""),
    };
    onAddSubtask(task.id, newSt);
    setStFormTitle(""); setStFormUser(users[0] ?? ""); setStFormStatus("todo");
    setStFormDescription("");
    setShowSubtaskForm(false);
  }

  // ── @mention autocomplete ───────────────────────────────────────────────
  function handleCommentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val    = e.target.value;
    setCommentText(val);

    // Detect @-query: find last @ before cursor
    const cursor = e.target.selectionStart ?? val.length;
    const before = val.slice(0, cursor);
    const match  = before.match(/@([\w ]*)$/);
    if (match) {
      setMentionQuery(match[0]);
      setMentionFilter(match[1].toLowerCase());
    } else {
      setMentionQuery(null);
      setMentionFilter("");
    }
  }

  function insertMention(userName: string) {
    if (!mentionQuery) return;
    const newText = commentText.replace(
      new RegExp(mentionQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"),
      `@${userName} `,
    );
    setCommentText(newText);
    setMentionQuery(null);
    setMentionFilter("");
    commentRef.current?.focus();
  }

  const mentionCandidates = mentionQuery !== null
    ? users.filter((u) => u.toLowerCase().includes(mentionFilter) && u !== currentUser)
    : [];

  // ── Submit comment ──────────────────────────────────────────────────────
  function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    const mentions = parseMentions(trimmed, users);

    const comment: Comment = {
      id:       crypto.randomUUID(),
      author:   currentUser,
      text:     trimmed,
      at:       new Date().toISOString(),
      mentions,
    };

    // Fire notifications for each mentioned user
    mentions.forEach((mentionedUser) => {
      const taskTitle = task.title.length > 40
        ? task.title.slice(0, 40) + "…"
        : task.title;
      addNotification({
        type:      "mention",
        message:   `${currentUser} mentioned ${mentionedUser} in: ${taskTitle}`,
        taskId:    task.id,
        projectId,
        from:      currentUser,
        to:        mentionedUser,
      });
    });

    onAddComment(task.id, comment);
    setCommentText("");
    setMentionQuery(null);
  }

  const taskId     = `DA-${task.id.slice(-3).toUpperCase()}`;
  const statusMeta = STATUS_BADGE[status];
  const prioMeta   = PRIORITY_META[priority];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-primary/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* ── Modal Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">{taskId}</span>
            {task.priority && (
              <span className={`material-symbols-outlined text-[18px] ${prioMeta.cls} shrink-0`}>
                {prioMeta.icon}
              </span>
            )}
            <span className="text-xs font-bold text-primary bg-primary/20 px-2 py-0.5 rounded uppercase shrink-0">
              {TYPE_LABELS_T[taskType] ?? taskType.charAt(0).toUpperCase() + taskType.slice(1)}
            </span>
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusMeta.cls}`}>
              <span className={`size-1.5 rounded-full ${statusMeta.dot}`} />
              {STATUS_OPTIONS_T.find((s) => s.value === status)?.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-primary/10 transition-colors shrink-0 ml-4"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* ── Body: 2-panel grid ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-5">

          {/* ─── Left: Edit panel (3/5) ─────────────────────────────────────── */}
          <div className="lg:col-span-3 overflow-y-auto border-r border-primary/20 p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t.tasks.detail.title}</label>
              <input
                value={title}
                onChange={(e) => { setTitle(e.target.value); touch(); }}
                disabled={!canEditAll}
                className={`w-full px-3 py-2.5 text-sm font-medium bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${!canEditAll ? disabledCls : ""}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t.tasks.detail.description}</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => { setDescription(e.target.value); touch(); }}
                placeholder="What needs to be done?"
                disabled={!canEditAll}
                className={`w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-500 transition-all ${!canEditAll ? disabledCls : ""}`}
              />
            </div>

          {/* ── Subtasks section ─────────────────────────────────────── */}
          {(subtasks !== undefined || canSave) && (
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-3">

              {/* Section header row */}
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[16px]">checklist</span>
                <span className="text-xs font-semibold text-slate-200">{t.subtasks.title}</span>
                {subtasks && subtasks.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full">
                    {subtasks.length}
                  </span>
                )}
              </div>

              {/* Add Subtask button — prominent, below the header */}
              {canSave && (
                <button
                  type="button"
                  onClick={() => setShowSubtaskForm((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-lg transition-colors w-full justify-center"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  {showSubtaskForm ? t.subtasks.cancel : t.subtasks.add}
                </button>
              )}

              {/* Existing subtask list */}
              {subtasks && subtasks.length > 0 ? (
                <div className="space-y-2">
                  {subtasks.map((st) => (
                    <SubtaskRow
                      key={st.id}
                      subtask={st}
                      users={users}
                      canEditAll={editMode === "full"}
                      canEditStatus={editMode !== "readonly"}
                      isAdmin={editMode === "full"}
                      onUpdate={(updated) => onUpdateSubtask?.(updated)}
                      onDelete={(stId) => onDeleteSubtask?.(stId, task.id)}
                    />
                  ))}
                </div>
              ) : (
                !showSubtaskForm && (
                  <p className="text-xs text-slate-600 italic text-center py-1">{t.subtasks.noSubtasks} — {t.subtasks.noSubtasksHint}</p>
                )
              )}

              {/* Subtask create form */}
              {showSubtaskForm && (
                <form onSubmit={handleAddSubtask} className="rounded-lg border border-primary/20 bg-slate-800/60 p-3 space-y-2">
                  {/* Title */}
                  <input
                    autoFocus
                    required
                    value={stFormTitle}
                    onChange={(e) => setStFormTitle(e.target.value)}
                    placeholder={t.subtasks.placeholder}
                    className="w-full bg-slate-700 border border-primary/20 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-primary/40"
                  />
                  {/* Assignee + Status row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500">{t.subtasks.assignedTo}</label>
                      <select
                        value={stFormUser}
                        onChange={(e) => setStFormUser(e.target.value)}
                        className="w-full bg-slate-700 border border-primary/20 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-primary/40"
                      >
                        {users.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500">Status</label>
                      <select
                        value={stFormStatus}
                        onChange={(e) => setStFormStatus(e.target.value as SubtaskStatus)}
                        className="w-full bg-slate-700 border border-primary/20 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-primary/40"
                      >
                        <option value="todo">{t.subtasks.todo}</option>
                        <option value="in_progress">{t.subtasks.inProgress}</option>
                        <option value="ready_to_be_deployed">{t.subtasks.readyToDeploy}</option>
                        <option value="done">{t.subtasks.done}</option>
                      </select>
                    </div>
                  </div>
                  {/* Description */}
                  <textarea
                    value={stFormDescription}
                    onChange={(e) => setStFormDescription(e.target.value)}
                    placeholder={t.subtasks.description}
                    rows={2}
                    className="w-full bg-slate-700 border border-primary/20 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-primary/40 resize-none"
                  />
                  {/* Buttons */}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowSubtaskForm(false); setStFormTitle(""); }}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {t.subtasks.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={!stFormTitle.trim()}
                      className="px-3 py-1 bg-primary text-white text-xs rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {t.subtasks.save}
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}

            {/* ── Task Details section header ────────────────────────────────────── */}
            <div className="border-t border-primary/10 pt-4">
              <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">tune</span>
                {t.tasks.detail.taskDetailsSection}
              </h4>
            </div>

            {/* Assigned To + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t.tasks.detail.assignedTo}</label>
                <select
                  value={assignedTo}
                  onChange={(e) => { setAssignedTo(e.target.value); touch(); }}
                  disabled={!canEditStatus}
                  className={`w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all ${!canEditStatus ? disabledCls : ""}`}
                >
                  {users.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t.tasks.detail.status}</label>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value as TaskStatus); touch(); }}
                  disabled={!canEditStatus}
                  className={`w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all ${!canEditStatus ? disabledCls : ""}`}
                >
                  {STATUS_OPTIONS_T.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {/* Priority + Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t.tasks.detail.priority}</label>
                <select
                  value={priority}
                  onChange={(e) => { setPriority(e.target.value as TaskPriority); touch(); }}
                  disabled={!canEditAll}
                  className={`w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all ${!canEditAll ? disabledCls : ""}`}
                >
                  {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{PRIORITY_LABELS_T[p]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t.tasks.detail.type}</label>
                <select
                  value={taskType}
                  onChange={(e) => { setTaskType(e.target.value as TaskType); touch(); }}
                  disabled={!canEditAll}
                  className={`w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all ${!canEditAll ? disabledCls : ""}`}
                >
                  {TYPE_OPTIONS.map((tp) => <option key={tp} value={tp}>{TYPE_LABELS_T[tp]}</option>)}
                </select>
              </div>
            </div>

            {/* Start Date + Target End Date + Completion Date */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t.tasks.detail.startDate}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); touch(); }}
                  disabled={!canEditStatus}
                  className={`w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all [color-scheme:dark] ${!canEditStatus ? disabledCls : ""}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t.tasks.detail.targetEndDate}</label>
                <input
                  type="date"
                  value={targetEndDate}
                  onChange={(e) => { setTargetEndDate(e.target.value); touch(); }}
                  disabled={!canEditStatus}
                  className={`w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all [color-scheme:dark] ${!canEditStatus ? disabledCls : ""}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t.tasks.detail.completionDate}</label>
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => { setCompletionDate(e.target.value); touch(); }}
                  disabled={!canEditStatus}
                  className={`w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all [color-scheme:dark] ${!canEditStatus ? disabledCls : ""}`}
                />
              </div>
            </div>

            {/* Save button — hidden for readonly users */}
            {canSave && isDirty && (
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-primary/20">
                <button
                  onClick={() => { setTitle(task.title); setDescription(task.description); setAssignedTo(task.assigned_to); setStatus(task.status); setPriority(task.priority ?? "medium"); setTaskType(task.type ?? "task"); setStartDate(task.start_date ?? ""); setTargetEndDate(task.target_end_date ?? ""); setCompletionDate(task.completion_date ?? ""); setIsDirty(false); }}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  {t.tasks.detail.save}
                </button>
              </div>
            )}

            {/* Delete Task — admin only */}
            {canEditAll && onDelete && (
              <div className="pt-4 border-t border-primary/10 flex">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 text-xs font-medium border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[13px]">delete_forever</span>
                  {t.tasks.detail.deleteTask}
                </button>
              </div>
            )}
          </div>

          {/* ─── Right: Comments panel (2/5) ─────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-primary/20 shrink-0">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">forum</span>
                {t.tasks.detail.comments}
                {comments.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full">
                    {comments.length}
                  </span>
                )}
              </h3>
            </div>

            {/* Comment list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-slate-600 text-[32px] block mb-2">
                    chat_bubble_outline
                  </span>
                  <p className="text-sm text-slate-500">{t.tasks.detail.noComments}</p>
                  <p className="text-xs text-slate-600 mt-1">{t.tasks.detail.noCommentsHint}</p>
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-3">
                    <Avatar name={c.author} size="size-7" textSize="text-[10px]" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-200">{c.author}</span>
                        <span suppressHydrationWarning className="text-[10px] text-slate-500">{relativeTime(c.at, t.time)}</span>
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed bg-primary/5 border border-primary/10 rounded-lg px-3 py-2">
                        {renderCommentText(c.text, users)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* New comment form */}
            <div className="px-5 py-4 border-t border-primary/20 shrink-0">
              <form onSubmit={handleCommentSubmit} className="space-y-2">
                <div className="flex items-start gap-2">
                  <Avatar name={currentUser || "?"} size="size-7" textSize="text-[10px]" className="mt-1" />
                  <div className="flex-1 relative">
                    <textarea
                      ref={commentRef}
                      rows={2}
                      value={commentText}
                      onChange={handleCommentChange}
                      placeholder={t.tasks.detail.addComment}
                      className="w-full px-3 py-2 text-xs bg-primary/5 border border-primary/20 text-slate-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-500 transition-all"
                    />

                    {/* @mention dropdown */}
                    {mentionCandidates.length > 0 && (
                      <div className="absolute bottom-full mb-1 left-0 w-48 bg-slate-900 border border-primary/20 rounded-lg shadow-2xl z-10 overflow-hidden">
                        {mentionCandidates.slice(0, 5).map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => insertMention(u)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-primary/10 transition-colors text-left"
                          >
                            <Avatar name={u} size="size-6" textSize="text-[10px]" />
                            <span className="text-xs text-slate-200 truncate">{u}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">send</span>
                    {t.tasks.detail.post}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete Task confirmation dialog ──────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-red-500/60 via-red-400/60 to-red-500/60" />
            <div className="px-6 py-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-red-400 text-[20px]">delete_forever</span>
                </div>
                <h2 className="text-base font-black text-white">{t.tasks.detail.deleteTask}</h2>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-200">{task.title}</span>?{" "}
                This action cannot be undone.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-lg border border-primary/30 text-slate-300 hover:bg-primary/5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    onDelete!(task.id);
                    onClose();
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {deleting ? (
                    <>
                      <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                      Deleting…
                    </>
                  ) : (
                    t.tasks.detail.deleteTask
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
