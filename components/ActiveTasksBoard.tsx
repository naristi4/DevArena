"use client";

import { useState, useEffect } from "react";
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
import type { Task, TaskStatus, TaskPriority, ActiveStatus } from "@/lib/tasks";
import { ACTIVE_STATUSES, applyStatusDates } from "@/lib/tasks";
import TaskDetailModal, { type Comment } from "@/components/TaskDetailModal";
import Avatar from "@/components/Avatar";
import type { Subtask, SubtaskStatus } from "@/lib/subtasks";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Task enriched with parent-project context for cross-project display */
export interface ActiveTask extends Task {
  projectTitle: string;
  projectSquad: string;
  dueDate:      string; // project.target_end_date
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS: {
  status:   ActiveStatus;
  color:    string;
  icon:     string;
  countCls: string;
}[] = [
  {
    status:   "in_progress",
    color:    "bg-primary",
    icon:     "sync",
    countCls: "bg-primary text-white",
  },
  {
    status:   "review",
    color:    "bg-blue-500",
    icon:     "rate_review",
    countCls: "bg-blue-500/20 text-blue-400",
  },
  {
    status:   "ready_to_release",
    color:    "bg-purple-500",
    icon:     "checklist",
    countCls: "bg-purple-500/20 text-purple-400",
  },
];

/** Quick-advance destinations (ready_to_release → done removes card from view) */
const NEXT_STATUS: Partial<Record<ActiveStatus, TaskStatus>> = {
  in_progress:      "review",
  review:           "ready_to_release",
  ready_to_release: "done",
};

const PRIORITY_META: Record<string, { icon: string; cls: string; label: string }> = {
  urgent: { icon: "keyboard_double_arrow_up", cls: "text-red-400",    label: "Urgent" },
  high:   { icon: "priority_high",            cls: "text-orange-400", label: "High"   },
  medium: { icon: "drag_handle",              cls: "text-green-400",  label: "Medium" },
  low:    { icon: "low_priority",             cls: "text-blue-400",   label: "Low"    },
};

const TYPE_BADGE: Record<string, string> = {
  task:      "bg-slate-700 text-slate-400",
  bug:       "bg-red-500/10 text-red-400",
  iteration: "bg-cyan-500/10 text-cyan-400",
};

// ─── Persistence ──────────────────────────────────────────────────────────────

const SQUAD_FILTER_KEY = "active_tasks_squad_filter";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
  });
}

function isDueSoon(iso: string): boolean {
  if (!iso) return false;
  const due   = new Date(iso + "T00:00:00").getTime();
  const today = Date.now();
  return due - today < 7 * 86_400_000 && due >= today;
}

function isOverdue(iso: string): boolean {
  if (!iso) return false;
  return new Date(iso + "T00:00:00").getTime() < Date.now();
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialTasks: ActiveTask[];
  squads:       string[];
  users:        string[];
  currentUser:  string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActiveTasksBoard({
  initialTasks,
  squads,
  users,
  currentUser,
}: Props) {
  const { data: session } = useSession();
  const isAdmin      = session?.user?.role === "Admin";
  const sessionUser  = session?.user?.name ?? currentUser;
  const { t } = useLanguage();

  const COLUMN_LABELS: Record<string, string> = {
    in_progress:      t.tasks.statuses.inProgress,
    review:           t.tasks.statuses.review,
    ready_to_release: t.tasks.statuses.readyToRelease,
  };

  const NEXT_LABEL: Partial<Record<ActiveStatus, string>> = {
    in_progress:      t.tasks.advance.toReview,
    review:           t.tasks.advance.toReadyToRelease,
    ready_to_release: t.tasks.advance.done,
  };

  const PRIORITY_LABELS: Record<string, string> = {
    urgent: t.tasks.priorities.urgent,
    high:   t.tasks.priorities.high,
    medium: t.tasks.priorities.medium,
    low:    t.tasks.priorities.low,
  };

  const TYPE_LABELS: Record<string, string> = {
    task:      t.tasks.types.task,
    bug:       t.tasks.types.bug,
    iteration: t.tasks.types.iteration,
  };

  const [tasks, setTasks]               = useState<ActiveTask[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<ActiveTask | null>(null);
  const [draggedId, setDraggedId]       = useState<string | null>(null);
  const [comments, setComments]         = useState<Record<string, Comment[]>>({});

  // ── Subtask state ─────────────────────────────────────────────────────────
  const [subtasks, setSubtasks] = useState<Record<string, Subtask[]>>({});
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set());

  // ── Filters ─────────────────────────────────────────────────────────────────
  // squadFilter is persisted in localStorage; userFilter + searchQuery are session-only
  const [squadFilter,  setSquadFilter]  = useState("");
  const [userFilter,   setUserFilter]   = useState("");
  const [searchQuery,  setSearchQuery]  = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(SQUAD_FILTER_KEY) ?? "";
    setSquadFilter(saved);
  }, []);

  function handleSquadChange(value: string) {
    setSquadFilter(value);
    if (value) localStorage.setItem(SQUAD_FILTER_KEY, value);
    else        localStorage.removeItem(SQUAD_FILTER_KEY);
  }

  // ── DnD setup ───────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    setDraggedId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggedId(null);
    const { active, over } = event;
    if (!over) return;
    // Guard: Squad Members can only move their own tasks
    const movedTask = tasks.find((t) => t.id === String(active.id));
    if (!movedTask) return;
    if (!isAdmin && movedTask.assigned_to !== sessionUser) return;
    const newStatus = over.id as TaskStatus;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === String(active.id) && t.status !== newStatus
          ? { ...t, status: newStatus, ...applyStatusDates(t, newStatus) }
          : t,
      ),
    );
    setSelectedTask((prev) =>
      prev && prev.id === String(active.id) ? { ...prev, status: newStatus, ...applyStatusDates(prev, newStatus) } : prev,
    );
  }

  // ── Quick-advance (→ Next Status button on card) ────────────────────────────
  function moveTask(id: string, next: TaskStatus) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: next, ...applyStatusDates(t, next) } : t));
  }

  // ── Modal: save edited task fields ──────────────────────────────────────────
  // Spread updated (Task) over existing ActiveTask to preserve enriched fields
  function handleTaskSave(updated: Task) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== updated.id) return t;
        const today  = new Date().toISOString().slice(0, 10);
        const merged = { ...t, ...updated };
        if (updated.status === "in_progress" && t.status !== "in_progress" && !merged.start_date) {
          merged.start_date = today;
        }
        if (updated.status === "done" && t.status !== "done" && !merged.completion_date) {
          merged.completion_date = today;
        }
        return merged;
      }),
    );
    setSelectedTask((prev) =>
      prev && prev.id === updated.id ? { ...prev, ...updated } : prev,
    );
  }

  // ── Modal: add comment ───────────────────────────────────────────────────────
  function handleAddComment(taskId: string, comment: Comment) {
    setComments((prev) => ({
      ...prev,
      [taskId]: [...(prev[taskId] ?? []), comment],
    }));
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

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function getEditMode(task: ActiveTask): "full" | "limited" | "readonly" {
    if (isAdmin) return "full";
    if (task.assigned_to === sessionUser) return "limited";
    return "readonly";
  }

  function canInteract(task: ActiveTask): boolean {
    return isAdmin || task.assigned_to === sessionUser;
  }

  // ── Derived values ───────────────────────────────────────────────────────────
  const draggedTask = draggedId ? tasks.find((t) => t.id === draggedId) ?? null : null;

  // All tasks currently in active statuses (unfiltered — for count badge)
  const totalInFlight = tasks.filter(
    (t) => (ACTIVE_STATUSES as string[]).includes(t.status),
  ).length;

  // Tasks visible after applying squad + user + search filters
  const visibleTasks = tasks
    .filter((t) => (ACTIVE_STATUSES as string[]).includes(t.status))
    .filter((t) => !squadFilter || t.projectSquad === squadFilter)
    .filter((t) => !userFilter  || t.assigned_to  === userFilter)
    .filter((t) => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const isFiltered = (!!squadFilter || !!userFilter || !!searchQuery) && visibleTasks.length < totalInFlight;

  return (
    <div className="space-y-5">

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Squad filter */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-500 text-[16px] shrink-0">groups</span>
          <div className="relative">
            <select
              value={squadFilter}
              onChange={(e) => handleSquadChange(e.target.value)}
              className={`pl-3 pr-8 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer ${
                squadFilter
                  ? "border border-primary/40 bg-primary/10 text-slate-100 font-medium"
                  : "border border-primary/20 bg-primary/5 text-slate-400"
              }`}
            >
              <option value="">{t.tasks.activeBoard.allSquads}</option>
              {squads.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              <span className="material-symbols-outlined text-slate-500 text-[14px]">expand_more</span>
            </span>
          </div>
          {squadFilter && (
            <button
              onClick={() => handleSquadChange("")}
              title="Clear squad filter"
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors"
            >
              {squadFilter}
              <span className="material-symbols-outlined text-[12px]">close</span>
            </button>
          )}
        </div>

        {/* User filter */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-500 text-[16px] shrink-0">person</span>
          <div className="relative">
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className={`pl-3 pr-8 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer ${
                userFilter
                  ? "border border-primary/40 bg-primary/10 text-slate-100 font-medium"
                  : "border border-primary/20 bg-primary/5 text-slate-400"
              }`}
            >
              <option value="">{t.tasks.activeBoard.allUsers}</option>
              {users.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              <span className="material-symbols-outlined text-slate-500 text-[14px]">expand_more</span>
            </span>
          </div>
          {userFilter && (
            <button
              onClick={() => setUserFilter("")}
              title="Clear user filter"
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors"
            >
              {userFilter.split(" ")[0]}
              <span className="material-symbols-outlined text-[12px]">close</span>
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[16px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.tasks.searchPlaceholder}
            className="pl-8 pr-7 py-1.5 text-sm bg-primary/5 border border-primary/20 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all w-48"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors"
              title="Clear search"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>

        {/* Task count */}
        <p className="text-sm text-slate-500 ml-auto">
          {visibleTasks.length} task{visibleTasks.length !== 1 ? "s" : ""} in flight
          {isFiltered && <span className="text-slate-600"> · {t.common.filtered}</span>}
        </p>
      </div>

      {/* ── Kanban board ────────────────────────────────────────────────────── */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-5 min-w-max">
            {COLUMNS.map(({ status, color, icon, countCls }) => {
              const cards = visibleTasks.filter((t) => t.status === status);
              const label = COLUMN_LABELS[status] ?? status;

              return (
                <DroppableColumn key={status} status={status}>

                  {/* Column header */}
                  <div className="flex items-center gap-2 px-1 mb-4">
                    <span className={`size-2 rounded-full ${color}`} />
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">{icon}</span>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${countCls}`}>{cards.length}</span>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-3">
                    {cards.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-primary/20 py-8 flex items-center justify-center">
                        <p className="text-xs text-slate-600">Drop here</p>
                      </div>
                    ) : (
                      cards.map((task) => (
                        <DraggableActiveCard
                          key={task.id}
                          task={task}
                          onMove={moveTask}
                          onClick={() => setSelectedTask(task)}
                          isBeingDragged={draggedId === task.id}
                          commentCount={comments[task.id]?.length ?? 0}
                          canDrag={canInteract(task)}
                          canAdvance={canInteract(task)}
                          nextLabelMap={NEXT_LABEL}
                          priorityLabels={PRIORITY_LABELS}
                          typeLabels={TYPE_LABELS}
                          taskSubtasks={subtasks[task.id] ?? []}
                          isSubtaskExpanded={expandedSubtasks.has(task.id)}
                          onToggleSubtaskExpand={toggleSubtaskExpand}
                        />
                      ))
                    )}
                  </div>
                </DroppableColumn>
              );
            })}
          </div>
        </div>

        {/* Ghost card shown while dragging */}
        <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
          {draggedTask && <GhostActiveCard task={draggedTask} />}
        </DragOverlay>
      </DndContext>

      {/* ── Task detail modal ──────────────────────────────────────────────── */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          users={users}
          currentUser={currentUser}
          projectId={selectedTask.project_id}
          comments={comments[selectedTask.id] ?? []}
          editMode={getEditMode(selectedTask)}
          onSave={handleTaskSave}
          onAddComment={handleAddComment}
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

function DroppableColumn({
  status,
  children,
}: {
  status:   ActiveStatus;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`w-80 shrink-0 flex flex-col p-3 rounded-xl transition-all duration-200 ${
        isOver ? "ring-2 ring-primary/50 bg-primary/5" : ""
      }`}
    >
      {children}
    </div>
  );
}

// ─── Draggable Card Wrapper ───────────────────────────────────────────────────

function DraggableActiveCard({
  task,
  onMove,
  onClick,
  isBeingDragged,
  commentCount,
  canDrag,
  canAdvance,
  nextLabelMap,
  priorityLabels,
  typeLabels,
  taskSubtasks,
  isSubtaskExpanded,
  onToggleSubtaskExpand,
}: {
  task:                   ActiveTask;
  onMove:                 (id: string, next: TaskStatus) => void;
  onClick:                () => void;
  isBeingDragged:         boolean;
  commentCount:           number;
  canDrag:                boolean;
  canAdvance:             boolean;
  nextLabelMap:           Partial<Record<ActiveStatus, string>>;
  priorityLabels:         Record<string, string>;
  typeLabels:             Record<string, string>;
  taskSubtasks:           Subtask[];
  isSubtaskExpanded:      boolean;
  onToggleSubtaskExpand:  (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-all duration-150 ${isDragging ? "opacity-40 scale-[0.97]" : ""}`}
    >
      <ActiveTaskCard
        task={task}
        onMove={onMove}
        onClick={onClick}
        dragHandleProps={{ ...attributes, ...listeners }}
        commentCount={commentCount}
        canDrag={canDrag}
        canAdvance={canAdvance}
        nextLabelMap={nextLabelMap}
        priorityLabels={priorityLabels}
        typeLabels={typeLabels}
        taskSubtasks={taskSubtasks}
        isSubtaskExpanded={isSubtaskExpanded}
        onToggleSubtaskExpand={onToggleSubtaskExpand}
      />
    </div>
  );
}

// ─── Ghost Card (DragOverlay) ─────────────────────────────────────────────────

function GhostActiveCard({ task }: { task: ActiveTask }) {
  return (
    <div className="w-80 bg-primary/10 border border-primary/40 p-4 rounded-xl shadow-2xl rotate-1 opacity-95 cursor-grabbing">
      <p className="text-sm font-semibold text-slate-100 line-clamp-2 mb-1.5">{task.title}</p>
      <div className="flex items-center gap-1.5">
        <span className="material-symbols-outlined text-slate-600 text-[13px]">folder</span>
        <span className="text-[11px] text-slate-500">{task.projectTitle}</span>
      </div>
    </div>
  );
}

// ─── Active Task Card ─────────────────────────────────────────────────────────

function ActiveTaskCard({
  task,
  onMove,
  onClick,
  dragHandleProps,
  commentCount,
  canDrag,
  canAdvance,
  nextLabelMap,
  priorityLabels,
  typeLabels,
  taskSubtasks,
  isSubtaskExpanded,
  onToggleSubtaskExpand,
}: {
  task:                   ActiveTask;
  onMove:                 (id: string, next: TaskStatus) => void;
  onClick:                () => void;
  dragHandleProps:        Record<string, unknown>;
  commentCount:           number;
  canDrag:                boolean;
  canAdvance:             boolean;
  nextLabelMap:           Partial<Record<ActiveStatus, string>>;
  priorityLabels:         Record<string, string>;
  typeLabels:             Record<string, string>;
  taskSubtasks:           Subtask[];
  isSubtaskExpanded:      boolean;
  onToggleSubtaskExpand:  (taskId: string) => void;
}) {
  const currentStatus = task.status as ActiveStatus;
  const nextStatus    = NEXT_STATUS[currentStatus];
  const nextLabel     = nextLabelMap[currentStatus];

  const prio      = PRIORITY_META[task.priority ?? "medium"];
  const prioLabel = priorityLabels[task.priority ?? "medium"] ?? prio.label;
  const typeCls   = TYPE_BADGE[task.type ?? "task"] ?? TYPE_BADGE.task;
  const typeLabel = typeLabels[task.type ?? "task"] ?? (task.type ?? "task");

  const dueFmt  = formatDate(task.target_end_date ?? "");
  const overdue = isOverdue(task.target_end_date ?? "");
  const soon    = !overdue && isDueSoon(task.target_end_date ?? "");
  const dueCls  = overdue ? "text-red-400" : soon ? "text-amber-400" : "text-slate-500";
  const dueIcon = overdue ? "warning"       : soon ? "schedule"       : "event";

  return (
    <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl shadow-sm hover:border-primary/40 transition-colors group">

      {/* Top row: priority icon + type badge + drag handle */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {task.priority && (
            <span
              className={`material-symbols-outlined text-[16px] ${prio.cls}`}
              title={prioLabel}
            >
              {prio.icon}
            </span>
          )}
          {task.type && (
            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${typeCls}`}>
              {typeLabel}
            </span>
          )}
        </div>
        {canDrag && (
          <span
            className="p-1 rounded text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing transition-colors shrink-0"
            title="Drag to move"
            {...dragHandleProps}
          >
            <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
          </span>
        )}
      </div>

      {/* Title — opens task detail modal */}
      <button
        onClick={onClick}
        className="text-left text-sm font-semibold text-slate-100 leading-snug mb-2 w-full hover:text-primary transition-colors line-clamp-2"
      >
        {task.title}
      </button>

      {/* Project name */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="material-symbols-outlined text-slate-600 text-[13px]">folder</span>
        <span className="text-[11px] text-slate-500 truncate">{task.projectTitle}</span>
      </div>

      {/* Footer: assignee · est · due · comments · advance button */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-2.5 mt-1 gap-2 flex-wrap">

        {/* Left: assignee avatar + first name */}
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar name={task.assigned_to} size="size-5" textSize="text-[9px]" />
          <span className="text-[11px] text-slate-400 truncate">
            {task.assigned_to.split(" ")[0]}
          </span>
        </div>

        {/* Right: metadata cluster */}
        <div className="flex items-center gap-2.5 shrink-0">

          {/* Due date */}
          {dueFmt && (
            <span suppressHydrationWarning className={`flex items-center gap-0.5 text-[11px] font-medium ${dueCls}`}>
              <span suppressHydrationWarning className="material-symbols-outlined text-[12px]">{dueIcon}</span>
              {dueFmt}
            </span>
          )}

          {/* Comment count */}
          {commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-slate-500">
              <span className="material-symbols-outlined text-[12px]">chat_bubble</span>
              {commentCount}
            </span>
          )}

          {/* Quick-advance button — own tasks only */}
          {canAdvance && nextStatus && nextLabel && (
            <button
              onClick={() => onMove(task.id, nextStatus)}
              title={`Move to ${nextLabel}`}
              className="text-[11px] text-slate-500 hover:text-primary transition-colors"
            >
              → {nextLabel}
            </button>
          )}
        </div>
      </div>

                  {/* Subtask progress strip */}
                  {(taskSubtasks ?? []).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-primary/10">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${((taskSubtasks ?? []).filter(s => s.status === "done").length / (taskSubtasks ?? []).length) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {(taskSubtasks ?? []).filter(s => s.status === "done").length}/{(taskSubtasks ?? []).length}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleSubtaskExpand(task.id); }}
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          <span className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${isSubtaskExpanded ? "rotate-180" : ""}`}>
                            expand_more
                          </span>
                        </button>
                      </div>
                      {/* Expandable subtask list */}
                      <div className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${isSubtaskExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                        <div className="overflow-hidden">
                          <div className="mt-2 space-y-1">
                            {(taskSubtasks ?? []).map((st) => {
                              const dotColor =
                                st.status === "done"                 ? "bg-emerald-500" :
                                st.status === "ready_to_be_deployed" ? "bg-blue-400"    :
                                st.status === "in_progress"          ? "bg-amber-400"   : "bg-slate-500";
                              return (
                                <div key={st.id} className="flex items-center gap-1.5 pl-1">
                                  <span className={`size-2 rounded-full shrink-0 ${dotColor}`} />
                                  <span className={`text-[10px] leading-tight flex-1 min-w-0 truncate ${st.status === "done" ? "line-through text-slate-600" : st.status === "ready_to_be_deployed" ? "text-blue-300" : "text-slate-400"}`}>
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
