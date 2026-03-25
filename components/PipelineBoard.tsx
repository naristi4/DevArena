"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import type { PipelineItem, PipelineImpact, PipelineStatus } from "@/lib/pipeline";
import EditProjectModal from "@/components/EditProjectModal";
import Avatar from "@/components/Avatar";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS: { status: PipelineStatus; icon: string; color: string }[] = [
  { status: "opportunity",        icon: "lightbulb",        color: "bg-slate-400"   },
  { status: "ideation",           icon: "tips_and_updates", color: "bg-primary"     },
  { status: "technical_design",   icon: "design_services",  color: "bg-emerald-500" },
  { status: "active_development", icon: "code",             color: "bg-amber-500"   },
  { status: "release",            icon: "rocket_launch",    color: "bg-purple-500"  },
  { status: "iteration",          icon: "loop",              color: "bg-cyan-500"    },
  { status: "clean_up",           icon: "cleaning_services", color: "bg-rose-500"    },
  { status: "completed",          icon: "task_alt",          color: "bg-green-500"   },
];

const NEXT_STATUS: Partial<Record<PipelineStatus, PipelineStatus>> = {
  opportunity:        "ideation",
  ideation:           "technical_design",
  technical_design:   "active_development",
  active_development: "release",
  release:            "iteration",
  iteration:          "clean_up",
  clean_up:           "completed",
};

const IMPACT_OPTIONS: PipelineImpact[] = [
  "Eficiencias/margen",
  "Calidad",
  "Product Market Fit",
  "Saldar deuda/sistematización",
];

const IMPACT_BADGE: Record<PipelineImpact, { label: string; cls: string }> = {
  "Product Market Fit":           { label: "High Impact",   cls: "bg-emerald-900/30 text-emerald-400" },
  "Eficiencias/margen":           { label: "High Impact",   cls: "bg-emerald-900/30 text-emerald-400" },
  "Calidad":                      { label: "Medium Impact", cls: "bg-amber-900/30   text-amber-400"   },
  "Saldar deuda/sistematización": { label: "Low Impact",    cls: "bg-slate-800      text-slate-400"   },
};

// ─── Persistence ──────────────────────────────────────────────────────────────

const SQUAD_FILTER_KEY = "pipeline_squad_filter";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialItems: PipelineItem[];
  squads:       string[];
  currentUser:  string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PipelineBoard({ initialItems, squads, currentUser }: Props) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "Admin";
  const { t } = useLanguage();
  const router = useRouter();

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

  const [items, setItems]             = useState<PipelineItem[]>(initialItems);
  const [showForm, setShowForm]       = useState(false);
  const [editingItem, setEditingItem] = useState<PipelineItem | null>(null);
  const [draggedId, setDraggedId]     = useState<string | null>(null);
  const [error, setError]             = useState("");

  // Sync with fresh server data after router.refresh()
  useEffect(() => { setItems(initialItems); }, [initialItems]);

  const [formTitle,  setFormTitle]  = useState("");
  const [formDesc,   setFormDesc]   = useState("");
  const [formImpact, setFormImpact] = useState<PipelineImpact>("Eficiencias/margen");
  const [formSquad,  setFormSquad]  = useState("");

  // ── Squad filter — persisted in localStorage ────────────────────────────────
  const [squadFilter, setSquadFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(SQUAD_FILTER_KEY) ?? "";
    setSquadFilter(saved);
  }, []);

  function handleSquadChange(value: string) {
    setSquadFilter(value);
    if (value) {
      localStorage.setItem(SQUAD_FILTER_KEY, value);
    } else {
      localStorage.removeItem(SQUAD_FILTER_KEY);
    }
  }

  // 8px activation distance prevents click-vs-drag misfire
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // ── DnD handlers ───────────────────────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    setDraggedId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggedId(null);
    if (!isAdmin) return;
    const { active, over } = event;
    if (!over) return;
    const itemId    = String(active.id);
    const newStatus = over.id as PipelineStatus;
    const prevItem  = items.find((i) => i.id === itemId);
    if (!prevItem || prevItem.status === newStatus) return;

    // Optimistic update
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, status: newStatus } : i));

    // Persist to DB (revert on failure)
    fetch(`/api/projects/${itemId}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: newStatus }),
    }).then((res) => {
      if (!res.ok) setItems((prev) => prev.map((i) => i.id === itemId ? prevItem : i));
    }).catch(() => {
      setItems((prev) => prev.map((i) => i.id === itemId ? prevItem : i));
    });
  }

  // ── Create ─────────────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          title:     formTitle.trim(),
          description: formDesc.trim(),
          impact:    formImpact,
          squadName: formSquad,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create project");
        return;
      }
      const created: PipelineItem = await res.json();
      setItems((prev) => [created, ...prev]);
      resetForm();
      router.refresh();
    } catch {
      setError("Network error — please try again");
    }
  }

  function resetForm() {
    setFormTitle(""); setFormDesc(""); setFormImpact("Eficiencias/margen");
    setFormSquad(""); setShowForm(false);
  }

  // ── Move (quick advance button) ────────────────────────────────────────────
  function moveItem(id: string, next: PipelineStatus) {
    const prevItem = items.find((i) => i.id === id);
    setItems(items.map((item) => (item.id === id ? { ...item, status: next } : item)));
    fetch(`/api/projects/${id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: next }),
    }).catch(() => {
      if (prevItem) setItems((prev) => prev.map((i) => i.id === id ? prevItem : i));
    });
  }

  // ── Edit save ──────────────────────────────────────────────────────────────
  async function handleEditSave(updated: PipelineItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setEditingItem(null);
    try {
      await fetch(`/api/projects/${updated.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          title:           updated.title,
          description:     updated.description,
          impact:          updated.impact,
          squadName:       updated.squad,
          prd_url:         updated.prd_url,
          odd_url:         updated.odd_url,
          trd_url:         updated.trd_url,
          start_date:      updated.start_date,
          target_end_date: updated.target_end_date,
          completion_date: updated.completion_date ?? "",
        }),
      });
      router.refresh();
    } catch {
      setError("Failed to save project — please try again");
    }
  }

  const draggedItem  = draggedId ? items.find((i) => i.id === draggedId) ?? null : null;
  const visibleItems = items
    .filter((i) => !squadFilter || i.squad === squadFilter)
    .filter((i) => !searchQuery || i.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const activeCount  = visibleItems.filter((i) => i.status !== "completed").length;

  return (
    <div className="space-y-6">

      {/* ── Error banner ─────────────────────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5">
          {error}
        </p>
      )}

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">

        {/* Left side — squad filter + item count */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Squad filter dropdown */}
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
                <option value="">{t.dashboard.allSquads}</option>
                {squads.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {/* Custom chevron (appearance-none removes the native arrow) */}
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                <span className="material-symbols-outlined text-slate-500 text-[14px]">expand_more</span>
              </span>
            </div>

            {/* Clear badge — only visible when a squad is selected */}
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

          {/* Active-item count */}
          <p className="text-sm text-slate-500">
            {activeCount} {activeCount !== 1 ? t.pipeline.activeItems : t.pipeline.activeItem}
            {(squadFilter || searchQuery) && (
              <span className="text-slate-600"> · {t.common.filtered}</span>
            )}
          </p>
        </div>

        {/* Right side — search + New Item button */}
        <div className="flex items-center gap-3">

          {/* Search input */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[16px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.pipeline.searchPlaceholder}
              className="pl-8 pr-7 py-1.5 text-sm bg-primary/5 border border-primary/20 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all w-52"
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

          {/* New Item button — Admin only */}
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              {showForm ? t.pipeline.form.cancel : t.pipeline.newItem}
            </button>
          )}
        </div>
      </div>

      {/* ── Inline create form ─────────────────────────────────────────────── */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-primary/5 border border-primary/20 rounded-xl p-5 shadow-sm space-y-4"
        >
          <h3 className="text-sm font-semibold text-slate-200">{t.pipeline.newItem}</h3>
          <p className="text-xs text-slate-500">
            Will be added to <span className="font-medium text-primary">Opportunity</span> · by {currentUser}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {t.pipeline.form.title} <span className="text-red-400">*</span>
              </label>
              <input
                required value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Mejorar tiempo de carga"
                className="w-full px-3 py-2 text-sm border border-primary/20 bg-background-dark text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.pipeline.form.impact}</label>
              <select value={formImpact} onChange={(e) => setFormImpact(e.target.value as PipelineImpact)}
                className="w-full px-3 py-2 text-sm border border-primary/20 bg-background-dark text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {IMPACT_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.pipeline.form.description}</label>
              <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2}
                placeholder="¿Qué problema resuelve esta iniciativa?"
                className="w-full px-3 py-2 text-sm border border-primary/20 bg-background-dark text-slate-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.pipeline.form.squad}</label>
              <select value={formSquad} onChange={(e) => setFormSquad(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-primary/20 bg-background-dark text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">{t.pipeline.form.noSquad}</option>
                {squads.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={resetForm} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-200 transition-colors">{t.pipeline.form.cancel}</button>
            <button type="submit" className="px-4 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">{t.pipeline.form.create}</button>
          </div>
        </form>
      )}

      {/* ── Kanban board with DnD ───────────────────────────────────────────── */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-5 min-w-max">
            {COLUMNS.map(({ status, color }) => {
              const cards      = visibleItems.filter((i) => i.status === status);
              const isIdeation = status === "ideation";
              const countCls   = isIdeation ? "bg-primary text-white" : "bg-slate-800 text-slate-400";
              const label      = STAGE_LABELS[status] ?? status;

              return (
                <DroppableColumn key={status} status={status}>
                  {/* Column header */}
                  <div className="flex items-center justify-between px-1 mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${color}`} />
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{label}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${countCls}`}>{cards.length}</span>
                    </div>
                    <button className="text-slate-500 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                    </button>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-3">
                    {cards.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-primary/20 py-8 flex items-center justify-center">
                        <p className="text-xs text-slate-600">Drop here</p>
                      </div>
                    ) : (
                      cards.map((item) => (
                        <DraggableCard
                          key={item.id}
                          item={item}
                          onMove={moveItem}
                          isIdeation={isIdeation}
                          onEdit={() => setEditingItem(item)}
                          isBeingDragged={draggedId === item.id}
                          isAdmin={isAdmin}
                          stageLabels={STAGE_LABELS}
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
          {draggedItem && <GhostCard item={draggedItem} />}
        </DragOverlay>
      </DndContext>

      {/* ── Edit modal ─────────────────────────────────────────────────────── */}
      {editingItem && (
        <EditProjectModal
          item={editingItem}
          squads={squads}
          onSave={handleEditSave}
          onClose={() => setEditingItem(null)}
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
  status:   PipelineStatus;
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

function DraggableCard({
  item,
  onMove,
  isIdeation,
  onEdit,
  isBeingDragged,
  isAdmin,
  stageLabels,
}: {
  item:           PipelineItem;
  onMove:         (id: string, next: PipelineStatus) => void;
  isIdeation:     boolean;
  onEdit:         () => void;
  isBeingDragged: boolean;
  isAdmin:        boolean;
  stageLabels:    Record<string, string>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-all duration-150 ${isDragging ? "opacity-40 scale-[0.97]" : ""}`}
    >
      <PipelineCard
        item={item}
        onMove={onMove}
        isIdeation={isIdeation}
        onEdit={onEdit}
        dragHandleProps={{ ...attributes, ...listeners }}
        isAdmin={isAdmin}
        stageLabels={stageLabels}
      />
    </div>
  );
}

// ─── Ghost Card (DragOverlay) ─────────────────────────────────────────────────

function GhostCard({ item }: { item: PipelineItem }) {
  const badge = IMPACT_BADGE[item.impact];
  return (
    <div className="w-80 bg-primary/10 border border-primary/40 p-4 rounded-xl shadow-2xl rotate-1 opacity-95 cursor-grabbing">
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
      <p className="text-slate-100 font-semibold text-sm mb-2 leading-relaxed line-clamp-2">{item.title}</p>
      <div className="flex items-center gap-2 border-t border-slate-800 pt-2 mt-2">
        <Avatar name={item.created_by} size="size-6" textSize="text-[10px]" />
        <span className="text-xs text-slate-400">{item.created_by}</span>
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function PipelineCard({
  item,
  onMove,
  isIdeation,
  onEdit,
  dragHandleProps,
  isAdmin,
  stageLabels,
}: {
  item:            PipelineItem;
  onMove:          (id: string, next: PipelineStatus) => void;
  isIdeation:      boolean;
  onEdit:          () => void;
  dragHandleProps: Record<string, unknown>;
  isAdmin:         boolean;
  stageLabels:     Record<string, string>;
}) {
  const next      = NEXT_STATUS[item.status];
  const nextLabel = next ? (stageLabels[next] ?? next) : null;
  const badge     = IMPACT_BADGE[item.impact];
  const targetDateFmt = item.target_end_date ? formatDate(item.target_end_date) : null;

  const borderCls = isIdeation
    ? "bg-primary/5 border-l-4 border-l-primary border border-primary/20"
    : "bg-primary/5 border border-primary/10";

  return (
    <div className={`${borderCls} p-4 rounded-xl shadow-sm hover:border-primary/50 transition-colors group`}>
      {/* Top row: impact badge + edit + drag handle */}
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${badge.cls}`}>
          {badge.label}
        </span>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <button
              onClick={onEdit}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-primary hover:bg-primary/10 transition-all"
              title="Edit project"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          )}
          {isAdmin && (
            <span
              className="p-1 rounded text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing transition-colors"
              title="Drag to move"
              {...dragHandleProps}
            >
              <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <Link
        href={`/projects/${item.id}`}
        className="text-slate-100 font-semibold text-sm mb-4 leading-relaxed block hover:text-primary transition-colors"
      >
        {item.title}
      </Link>

      {/* Status tag */}
      {(item.status === "ideation" || item.status === "technical_design") && (
        <div className="flex items-center gap-2 mb-3">
          {item.prd_url ? (
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
              Sponsor Review
            </span>
          ) : (
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-medium">
              PRD Drafting
            </span>
          )}
        </div>
      )}

      {/* Progress bar — active_development only, based on task completion */}
      {item.status === "active_development" && (() => {
        const total = item.totalTasks     ?? 0;
        const done  = item.completedTasks ?? 0;
        const pct   = total === 0 ? 0 : Math.round((done / total) * 100);
        return (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>Progress</span>
              <span>{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            {total > 0 && (
              <p className="text-[10px] text-slate-600 mt-0.5">{done}/{total} tasks done</p>
            )}
          </div>
        );
      })()}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-2">
        <div className="flex items-center gap-2">
          <Avatar name={item.created_by} size="size-6" textSize="text-[10px]" />
          <span className="text-xs text-slate-400">{item.created_by}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className="material-symbols-outlined text-[12px]">event</span>
              {targetDateFmt ? `Target Delivery: ${targetDateFmt}` : "No target date"}
            </span>
          {isAdmin && next && nextLabel && (
            <button
              onClick={() => onMove(item.id, next)}
              className="text-xs text-slate-500 hover:text-primary transition-colors"
              title={`Move to ${nextLabel}`}
            >
              → {nextLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
