"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Task, TaskStatus, TaskType, TaskPriority } from "@/lib/tasks";
import { applyStatusDates } from "@/lib/tasks";
import type { Translations } from "@/locales/en";
import TaskDetailModal, { type Comment } from "@/components/TaskDetailModal";
import Avatar from "@/components/Avatar";
import type { Subtask, SubtaskStatus } from "@/lib/subtasks";
import { MOCK_SUBTASKS }               from "@/lib/subtasks";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS: { status: TaskStatus; label: string; color: string; icon: string }[] = [
  { status: "backlog",          label: "Backlog",          color: "bg-slate-500",  icon: "list_alt"    },
  { status: "in_progress",      label: "In Progress",      color: "bg-primary",    icon: "sync"        },
  { status: "review",           label: "Review",           color: "bg-blue-500",   icon: "rate_review" },
  { status: "ready_to_release", label: "Ready to Release", color: "bg-purple-500", icon: "checklist"   },
  { status: "done",             label: "Done",             color: "bg-green-500",  icon: "task_alt"    },
];

const NEXT_STATUS: Partial<Record<TaskStatus, TaskStatus>> = {
  backlog:          "in_progress",
  in_progress:      "review",
  review:           "ready_to_release",
  ready_to_release: "done",
};

const PRIORITY_META: Record<string, { icon: string; cls: string }> = {
  urgent: { icon: "keyboard_double_arrow_up", cls: "text-red-400"    },
  high:   { icon: "priority_high",            cls: "text-orange-400" },
  medium: { icon: "drag_handle",              cls: "text-green-400"  },
  low:    { icon: "low_priority",             cls: "text-blue-400"   },
};


const TYPE_OPTIONS:     TaskType[]     = ["task", "bug", "iteration"];
const PRIORITY_OPTIONS: TaskPriority[] = ["urgent", "high", "medium", "low"];

const MS_DAY  = 1000 * 60 * 60 * 24;
const MS_WEEK = MS_DAY * 7;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isDueSoon(iso: string): boolean {
  if (!iso) return false;
  const due = new Date(iso + "T00:00:00").getTime();
  return due - Date.now() < 7 * 86_400_000 && due >= Date.now();
}

function isOverdue(iso: string): boolean {
  if (!iso) return false;
  return new Date(iso + "T00:00:00").getTime() < Date.now();
}

// ─── Metrics computation ──────────────────────────────────────────────────────

interface ProjectInfo {
  start_date:      string;
  target_end_date: string;
  status:          string;
}

interface Metrics {
  daysElapsed:        number;
  daysPlanned:        number;
  progressPct:        number;
  velocity:           string;
  doneCount:          number;
  onTimeRate:         number | null;
  onTimeCount:        number;
  doneWithDatesCount: number;
}

function computeMetrics(tasks: Task[], project: ProjectInfo): Metrics {
  const today     = new Date();
  const startDate = parseDate(project.start_date);
  const endDate   = parseDate(project.target_end_date);

  const daysElapsed = Math.max(Math.floor((today.getTime() - startDate.getTime()) / MS_DAY), 0);
  const daysPlanned = Math.max(Math.floor((endDate.getTime()  - startDate.getTime()) / MS_DAY), 1);
  const progressPct = Math.min(Math.round((daysElapsed / daysPlanned) * 100), 100);

  const doneCount    = tasks.filter((t) => t.status === "done").length;
  const weeksElapsed = Math.max((today.getTime() - startDate.getTime()) / MS_WEEK, 1);
  const velocity     = (doneCount / weeksElapsed).toFixed(1);

  const doneWithDates = tasks.filter(
    (t) => t.status === "done" && t.target_end_date && t.completion_date && t.type !== "iteration",
  );
  const onTimeCount = doneWithDates.filter((t) => t.completion_date! <= t.target_end_date!).length;
  const onTimeRate  = doneWithDates.length > 0
    ? Math.round((onTimeCount / doneWithDates.length) * 100)
    : null;

  return { daysElapsed, daysPlanned, progressPct, velocity, doneCount, onTimeRate, onTimeCount, doneWithDatesCount: doneWithDates.length };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialTasks:  Task[];
  projectId:     string;
  users:         string[];
  project:       ProjectInfo;
  currentUser?:  string;
  canEdit?:      boolean;
  projectSquad?: string;
  hideMetrics?:  boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaskBoard({
  initialTasks,
  projectId,
  users,
  project,
  currentUser = "",
  canEdit = true,
  projectSquad,
  hideMetrics = false,
}: Props) {
  const { data: session } = useSession();
  const isAdminBoard  = session?.user?.role === "Admin";
  const sessionUser   = session?.user?.name ?? currentUser;
  const { t } = useLanguage();

  const COLUMN_LABELS: Record<string, string> = {
    backlog:          t.tasks.columns.backlog,
    in_progress:      t.tasks.columns.inProgress,
    review:           t.tasks.columns.review,
    ready_to_release: t.tasks.columns.readyToRelease,
    done:             t.tasks.columns.done,
  };

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

  function getEditMode(task: Task): "full" | "limited" | "readonly" {
    if (isAdminBoard) return "full";
    if (task.assigned_to === sessionUser) return "limited";
    return "readonly";
  }

  const [tasks, setTasks]               = useState<Task[]>(initialTasks);
  const [showForm, setShowForm]         = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedId, setDraggedId]       = useState<string | null>(null);

  // Comments stored per taskId
  const [comments, setComments] = useState<Record<string, Comment[]>>({});

  // ── Subtask state ─────────────────────────────────────────────────────────
  const [subtasks, setSubtasks] = useState<Record<string, Subtask[]>>(() =>
    (initialTasks.map(t => t.id)).reduce<Record<string, Subtask[]>>((acc, id) => {
      acc[id] = MOCK_SUBTASKS.filter(st => st.task_id === id);
      return acc;
    }, {})
  );
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set());

  // Create-form state
  const [formTitle,         setFormTitle]         = useState("");
  const [formDesc,          setFormDesc]          = useState("");
  const [formUser,          setFormUser]          = useState(users[0] ?? "");
  const [formTargetEndDate, setFormTargetEndDate] = useState("");
  const [formStatus,        setFormStatus]        = useState<TaskStatus>("backlog");
  const [formType,          setFormType]          = useState<TaskType>("task");
  const [formPriority,      setFormPriority]      = useState<TaskPriority>("medium");

  const metrics = computeMetrics(tasks, project);

  // 8px activation prevents click-vs-drag misfire
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // ── DnD handlers ─────────────────────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    setDraggedId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggedId(null);
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as TaskStatus;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === String(active.id) && t.status !== newStatus
          ? { ...t, status: newStatus, ...applyStatusDates(t, newStatus) }
          : t,
      ),
    );
    // Sync selected task if it was moved
    setSelectedTask((prev) =>
      prev && prev.id === String(active.id) ? { ...prev, status: newStatus, ...applyStatusDates(prev, newStatus) } : prev,
    );
  }

  // ── Create ───────────────────────────────────────────────────────────────
  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) return;
    const task: Task = {
      id:              String(Date.now()),
      title:           formTitle.trim(),
      description:     formDesc.trim(),
      project_id:      projectId,
      assigned_to:     formUser,
      estimated_time:  0,
      actual_time:     0,
      status:          formStatus,
      type:            formType,
      priority:        formPriority,
      target_end_date: formTargetEndDate || undefined,
    };
    setTasks([task, ...tasks]);
    cancelForm();
  }

  function cancelForm() {
    setShowForm(false); setFormTitle(""); setFormDesc("");
    setFormUser(users[0] ?? ""); setFormTargetEndDate(""); setFormStatus("backlog");
    setFormType("task"); setFormPriority("medium");
  }

  // ── Move (quick advance) ─────────────────────────────────────────────────
  function moveTask(id: string, next: TaskStatus) {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status: next, ...applyStatusDates(t, next) } : t)));
  }

  // ── Task edit (from modal) ───────────────────────────────────────────────
  function handleTaskSave(updated: Task) {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== updated.id) return t;
      const today  = new Date().toISOString().slice(0, 10);
      const merged = { ...updated };
      if (updated.status === "in_progress" && t.status !== "in_progress" && !merged.start_date) {
        merged.start_date = today;
      }
      if (updated.status === "done" && t.status !== "done" && !merged.completion_date) {
        merged.completion_date = today;
      }
      return merged;
    }));
    setSelectedTask(updated);
  }

  // ── Delete task (admin only) ─────────────────────────────────────────────
  function handleTaskDelete(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSubtasks((prev) => { const next = { ...prev }; delete next[taskId]; return next; });
    setSelectedTask(null);
  }

  // ── Subtask handlers ───────────────────────────────────────────────────────
  function toggleSubtaskExpand(taskId: string) {
    setExpandedSubtasks((prev) => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  }

  function handleAddSubtask(taskId: string, st: Subtask) {
    setSubtasks((prev) => ({
      ...prev,
      [taskId]: [...(prev[taskId] ?? []), st],
    }));
  }

  function handleUpdateSubtask(updated: Subtask) {
    setSubtasks((prev) => ({
      ...prev,
      [updated.task_id]: (prev[updated.task_id] ?? []).map((st) =>
        st.id === updated.id ? updated : st
      ),
    }));
  }

  function handleDeleteSubtask(subtaskId: string, taskId: string) {
    setSubtasks((prev) => ({
      ...prev,
      [taskId]: (prev[taskId] ?? []).filter((st) => st.id !== subtaskId),
    }));
  }

  function handleUpdateSubtaskStatus(subtaskId: string, taskId: string, newStatus: SubtaskStatus) {
    setSubtasks((prev) => ({
      ...prev,
      [taskId]: (prev[taskId] ?? []).map((st) =>
        st.id === subtaskId ? { ...st, status: newStatus } : st
      ),
    }));
  }

  // ── Add comment (from modal) ─────────────────────────────────────────────
  function handleAddComment(taskId: string, comment: Comment) {
    setComments((prev) => ({
      ...prev,
      [taskId]: [...(prev[taskId] ?? []), comment],
    }));
  }

  const draggedTask = draggedId ? tasks.find((t) => t.id === draggedId) ?? null : null;

  return (
    <div className="space-y-6">

      {/* ── Metrics bar ───────────────────────────────────────────────────── */}
      {!hideMetrics && <MetricsBar metrics={metrics} t={t} />}

      {/* ── View-only banner ──────────────────────────────────────────────── */}
      {!canEdit && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          <span>
            View only — this project belongs to{" "}
            <strong>{projectSquad ?? "another squad"}</strong>. Only squad members can add or move tasks.
          </span>
        </div>
      )}

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Task Board</h2>
          <p className="text-sm text-slate-400">
            Tasks: {tasks.length}
            {"  "}·{"  "}
            {tasks.filter((t) => t.status !== "done").length} open ·{" "}
            {tasks.filter((t) => t.status === "done").length} done ·{" "}
            <span className={tasks.filter((t) => t.type === "bug").length > 0 ? "text-red-400 font-semibold" : ""}>
              Bugs: {tasks.filter((t) => t.type === "bug").length}
            </span>
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t.tasks.detail.newTask}
          </button>
        )}
      </div>

      {/* ── Create task modal ─────────────────────────────────────────────── */}
      {canEdit && showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) cancelForm(); }}
        >
          <div className="w-full max-w-lg bg-slate-900 border border-primary/20 rounded-2xl shadow-2xl shadow-black/40">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-primary/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">add_task</span>
                <h2 className="text-sm font-bold text-slate-200">{t.tasks.detail.newTask}</h2>
              </div>
              <button
                type="button"
                onClick={cancelForm}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal form body */}
            <form onSubmit={handleCreate} className="p-6 space-y-4">

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  {t.tasks.detail.title} <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  autoFocus
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Implement auth endpoint"
                  className="w-full px-3 py-2 text-sm border border-primary/20 bg-slate-800 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  {t.tasks.detail.description}
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2 text-sm border border-primary/20 bg-slate-800 text-slate-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-500"
                />
              </div>

              {/* Assignee + Priority row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    {t.tasks.detail.assignedTo}
                  </label>
                  <select
                    value={formUser}
                    onChange={(e) => setFormUser(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-primary/20 bg-slate-800 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {users.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    {t.tasks.detail.priority}
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 text-sm border border-primary/20 bg-slate-800 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{PRIORITY_LABELS_T[p]}</option>)}
                  </select>
                </div>
              </div>

              {/* Target delivery date */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  {t.tasks.detail.targetEndDate}
                </label>
                <input
                  type="date"
                  value={formTargetEndDate}
                  onChange={(e) => setFormTargetEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-primary/20 bg-slate-800 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent [color-scheme:dark]"
                />
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-primary/10">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!formTitle.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-[16px]">add_task</span>
                  {t.tasks.detail.createTask}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── Kanban board with DnD ─────────────────────────────────────────── */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-5 min-w-max">
            {COLUMNS.map(({ status, color, icon }) => {
              const cards    = tasks.filter((t) => t.status === status);
              const colLabel = COLUMN_LABELS[status];
              const badgeCls =
                status === "in_progress" ? "bg-primary text-white"
                : status === "done"      ? "bg-green-500/10 text-green-500"
                : "bg-slate-800 text-slate-400";

              return (
                <DroppableColumn key={status} status={status}>
                  {/* Column header */}
                  <div className="flex items-center justify-between px-1 mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${color}`} />
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">{icon}</span>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{colLabel}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${badgeCls}`}>{cards.length}</span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-3">
                    {cards.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-primary/20 py-8 flex items-center justify-center">
                        <p className="text-xs text-slate-600">Drop here</p>
                      </div>
                    ) : (
                      cards.map((task) => (
                        <DraggableTaskCard
                          key={task.id}
                          task={task}
                          onMove={moveTask}
                          canEdit={canEdit}
                          onClick={() => setSelectedTask(task)}
                          commentCount={comments[task.id]?.length ?? 0}
                          columnLabels={COLUMN_LABELS}
                          typeLabels={TYPE_LABELS_T}
                          taskSubtasks={subtasks[task.id] ?? []}
                          expanded={expandedSubtasks.has(task.id)}
                          onToggleExpand={() => toggleSubtaskExpand(task.id)}
                          onUpdateSubtaskStatus={(stId, newSt) => handleUpdateSubtaskStatus(stId, task.id, newSt)}
                          canEditSubtasks={getEditMode(task) !== "readonly"}
                        />
                      ))
                    )}
                  </div>
                </DroppableColumn>
              );
            })}
          </div>
        </div>

        {/* Ghost card while dragging */}
        <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
          {draggedTask && <GhostTaskCard task={draggedTask} />}
        </DragOverlay>
      </DndContext>

      {/* ── Task detail modal ─────────────────────────────────────────────── */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          users={users}
          currentUser={currentUser || users[0] || ""}
          projectId={projectId}
          comments={comments[selectedTask.id] ?? []}
          editMode={getEditMode(selectedTask)}
          onSave={handleTaskSave}
          onAddComment={handleAddComment}
          onDelete={isAdminBoard ? handleTaskDelete : undefined}
          onClose={() => setSelectedTask(null)}
          subtasks={subtasks[selectedTask?.id ?? ""] ?? []}
          onAddSubtask={handleAddSubtask}
          onUpdateSubtask={handleUpdateSubtask}
          onDeleteSubtask={handleDeleteSubtask}
        />
      )}
    </div>
  );
}

// ─── Droppable Column ─────────────────────────────────────────────────────────

function DroppableColumn({ status, children }: { status: TaskStatus; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 flex flex-col p-2 rounded-xl transition-all duration-200 ${
        isOver ? "ring-2 ring-primary/50 bg-primary/5" : ""
      }`}
    >
      {children}
    </div>
  );
}

// ─── Draggable Task Card Wrapper ──────────────────────────────────────────────

function DraggableTaskCard({
  task,
  onMove,
  canEdit,
  onClick,
  commentCount,
  columnLabels,
  typeLabels,
  taskSubtasks,
  expanded,
  onToggleExpand,
  onUpdateSubtaskStatus,
  canEditSubtasks,
}: {
  task:                 Task;
  onMove:               (id: string, next: TaskStatus) => void;
  canEdit:              boolean;
  onClick:              () => void;
  commentCount:         number;
  columnLabels:         Record<string, string>;
  typeLabels:           Record<string, string>;
  taskSubtasks:         Subtask[];
  expanded:             boolean;
  onToggleExpand:       () => void;
  onUpdateSubtaskStatus:(subtaskId: string, newStatus: SubtaskStatus) => void;
  canEditSubtasks:      boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-all duration-150 ${isDragging ? "opacity-40 scale-[0.97]" : ""}`}
    >
      <TaskCard
        task={task}
        onMove={onMove}
        canEdit={canEdit}
        onClick={onClick}
        dragHandleProps={{ ...attributes, ...listeners }}
        commentCount={commentCount}
        columnLabels={columnLabels}
        typeLabels={typeLabels}
        taskSubtasks={taskSubtasks}
        expanded={expanded}
        onToggleExpand={onToggleExpand}
        onUpdateSubtaskStatus={onUpdateSubtaskStatus}
        canEditSubtasks={canEditSubtasks}
      />
    </div>
  );
}

// ─── Ghost Task Card ──────────────────────────────────────────────────────────

function GhostTaskCard({ task }: { task: Task }) {
  const taskId = `DA-${task.id.slice(-3).toUpperCase()}`;
  return (
    <div className="w-72 bg-primary/10 border border-primary/40 p-4 rounded-xl shadow-2xl rotate-1 opacity-95 cursor-grabbing">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase">{taskId}</span>
      </div>
      <p className="text-sm font-semibold text-slate-100 line-clamp-2">{task.title}</p>
    </div>
  );
}

// ─── Metrics Bar ──────────────────────────────────────────────────────────────

function MetricsBar({ metrics, t }: { metrics: Metrics; t: Translations }) {
  const { daysElapsed, daysPlanned, progressPct, velocity, doneCount, onTimeRate, onTimeCount, doneWithDatesCount } = metrics;
  const onTimeColor = onTimeRate === null ? "text-slate-400" : onTimeRate >= 80 ? "text-emerald-400" : onTimeRate >= 60 ? "text-amber-400" : "text-red-400";
  const barColor    = progressPct >= 100 ? "bg-red-400" : progressPct >= 80 ? "bg-amber-400" : "bg-primary";

  return (
    <div className="bg-primary/5 rounded-xl border border-primary/20 p-5">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Metrics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{t.projectDetail.leadTime}</p>
          <p className="text-3xl font-bold text-slate-100">{daysElapsed}<span className="text-base font-normal text-slate-400 ml-1">{t.common.days}</span></p>
          <p className="text-xs text-slate-500 mt-0.5">{t.projectDetail.ofPlanned.replace("{n}", String(daysPlanned))}</p>
          <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1">{progressPct}{t.projectDetail.timelineUsed}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Task Velocity</p>
          <p className="text-3xl font-bold text-slate-100">{velocity}<span className="text-base font-normal text-slate-400 ml-1">/ week</span></p>
          <p className="text-xs text-slate-500 mt-0.5">{doneCount} {t.tasks.metricsBar.tasks.toLowerCase()}{doneCount !== 1 ? "s" : ""} {t.tasks.metricsBar.done}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{t.tasks.metricsBar.onTimeRate}</p>
          {onTimeRate !== null ? (
            <>
              <p className={`text-3xl font-bold ${onTimeColor}`}>{onTimeRate}<span className="text-base font-normal text-slate-400 ml-0.5">%</span></p>
              <p className="text-xs text-slate-500 mt-0.5">{onTimeCount} of {doneWithDatesCount} {t.tasks.metricsBar.onTime}</p>
              <p className="text-xs text-slate-600 mt-3">{onTimeRate >= 80 ? "Delivery on track" : onTimeRate >= 60 ? "Some delays" : "Significant delays"}</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-slate-500">—</p>
              <p className="text-xs text-slate-500 mt-0.5">No completed tasks with dates yet</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onMove,
  canEdit = true,
  onClick,
  dragHandleProps,
  commentCount,
  columnLabels,
  typeLabels,
  taskSubtasks,
  expanded,
  onToggleExpand,
  onUpdateSubtaskStatus,
  canEditSubtasks,
}: {
  task:                 Task;
  onMove:               (id: string, next: TaskStatus) => void;
  canEdit?:             boolean;
  onClick:              () => void;
  dragHandleProps:      Record<string, unknown>;
  commentCount:         number;
  columnLabels:         Record<string, string>;
  typeLabels:           Record<string, string>;
  taskSubtasks:         Subtask[];
  expanded:             boolean;
  onToggleExpand:       () => void;
  onUpdateSubtaskStatus:(subtaskId: string, newStatus: SubtaskStatus) => void;
  canEditSubtasks:      boolean;
}) {
  const next         = NEXT_STATUS[task.status];
  const nextLabel    = next ? (columnLabels[next] ?? COLUMNS.find((c) => c.status === next)?.label ?? null) : null;
  const priorityMeta = PRIORITY_META[task.priority ?? "low"];
  const taskType     = task.type ?? "task";
  const isDone       = task.status === "done";
  const isInProgress = task.status === "in_progress";
  const taskId       = `DA-${task.id.slice(-3).toUpperCase()}`;

  const cardCls = isDone
    ? "grayscale opacity-60 bg-primary/5 border border-primary/10 p-4 rounded-xl"
    : isInProgress
    ? "bg-primary/10 border-l-4 border-l-primary border-y border-r border-primary/20 p-4 rounded-xl transition-colors hover:border-primary/40 cursor-pointer"
    : "bg-primary/5 border border-primary/10 p-4 rounded-xl transition-colors hover:border-primary/40 cursor-pointer";

  const titleCls = isDone
    ? "text-sm font-semibold text-slate-400 line-through mb-3 leading-relaxed"
    : "text-sm font-semibold text-slate-100 mb-3 leading-relaxed";

  return (
    <div className={cardCls} onClick={onClick}>
      {/* Header: task ID + priority + drag handle */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{taskId}</span>
        <div className="flex items-center gap-1">
          {task.priority && (
            <span className={`material-symbols-outlined text-[16px] ${priorityMeta.cls}`}>
              {priorityMeta.icon}
            </span>
          )}
          {canEdit && (
            <span
              onClick={(e) => e.stopPropagation()}
              className="p-0.5 rounded text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing transition-colors"
              title="Drag to move"
              {...dragHandleProps}
            >
              <span className="material-symbols-outlined text-[14px]">drag_indicator</span>
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <p className={titleCls}>{task.title}</p>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-3">
        <div className="flex items-center gap-2">
          <Avatar name={task.assigned_to} size="size-6" textSize="text-[10px]" />
          {task.target_end_date && (() => {
            const dueFmt  = formatDate(task.target_end_date);
            const overdue = isOverdue(task.target_end_date);
            const soon    = !overdue && isDueSoon(task.target_end_date);
            const dueCls  = overdue ? "text-red-400" : soon ? "text-amber-400" : "text-slate-500";
            const dueIcon = overdue ? "warning" : soon ? "schedule" : "event";
            return (
              <span suppressHydrationWarning className={`flex items-center gap-0.5 text-[10px] font-medium ${dueCls}`}>
                <span suppressHydrationWarning className="material-symbols-outlined text-[12px]">{dueIcon}</span>
                {dueFmt}
              </span>
            );
          })()}
        </div>
        <div className="flex items-center gap-2">
          {commentCount > 0 && (
            <div className="flex items-center gap-0.5 text-[10px] text-slate-500">
              <span className="material-symbols-outlined text-[12px]">chat_bubble_outline</span>
              <span>{commentCount}</span>
            </div>
          )}
          <span className={
            taskType === "bug"
              ? "bg-red-500/15 px-2 py-0.5 rounded text-[10px] font-bold text-red-400 uppercase"
              : "bg-primary/20 px-2 py-0.5 rounded text-[10px] font-bold text-primary uppercase"
          }>
            {typeLabels[taskType] ?? taskType.charAt(0).toUpperCase() + taskType.slice(1)}
          </span>
          {canEdit && next && nextLabel && (
            <button
              onClick={(e) => { e.stopPropagation(); onMove(task.id, next); }}
              className="text-slate-500 hover:text-primary transition-colors"
              title={`Move to ${nextLabel}`}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          )}
        </div>
      </div>

        {/* ── Subtask progress strip ──────────────────────────────────────── */}
        {taskSubtasks.length > 0 && (
          <div className="mt-2 pt-2 border-t border-primary/10">
            {/* Progress bar + count + chevron */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${(taskSubtasks.filter(s => s.status === "done").length / taskSubtasks.length) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 shrink-0">
                {taskSubtasks.filter(s => s.status === "done").length}/{taskSubtasks.length}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <span className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
                  expand_more
                </span>
              </button>
            </div>

            {/* Expandable subtask list */}
            <div className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden">
                <div className="mt-2 space-y-1">
                  {taskSubtasks.map((st) => {
                    const dotColor =
                      st.status === "done"        ? "bg-emerald-500" :
                      st.status === "in_progress" ? "bg-amber-400"   : "bg-slate-500";
                    const nextStatus: Record<string, SubtaskStatus> = {
                      todo: "in_progress", in_progress: "done", done: "todo",
                    };
                    return (
                      <div key={st.id} className="flex items-center gap-1.5 pl-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canEditSubtasks) onUpdateSubtaskStatus(st.id, nextStatus[st.status]);
                          }}
                          disabled={!canEditSubtasks}
                          className={`size-2 rounded-full shrink-0 ${dotColor} ${canEditSubtasks ? "cursor-pointer hover:opacity-70" : "cursor-default"}`}
                        />
                        <span className={`text-[10px] leading-tight flex-1 min-w-0 truncate ${st.status === "done" ? "line-through text-slate-600" : "text-slate-400"}`}>
                          {st.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
