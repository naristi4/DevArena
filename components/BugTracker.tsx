"use client";

import { useState } from "react";
import type { Bug, BugSeverity } from "@/lib/bugs";

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_OPTIONS: BugSeverity[] = ["critical", "major", "minor"];

const SEVERITY_STYLES: Record<BugSeverity, string> = {
  critical: "bg-red-100 text-red-700",
  major:    "bg-amber-100 text-amber-700",
  minor:    "bg-gray-100 text-gray-500",
};

const SEVERITY_ORDER: Record<BugSeverity, number> = {
  critical: 0,
  major:    1,
  minor:    2,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialBugs: Bug[];
  projectId:   string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BugTracker({ initialBugs, projectId }: Props) {
  const [bugs, setBugs]           = useState<Bug[]>(initialBugs);
  const [showForm, setShowForm]   = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc]   = useState("");
  const [formSev, setFormSev]     = useState<BugSeverity>("major");

  const sorted = [...bugs].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  const criticalCount = bugs.filter((b) => b.severity === "critical").length;
  const majorCount    = bugs.filter((b) => b.severity === "major").length;
  const minorCount    = bugs.filter((b) => b.severity === "minor").length;

  // ── Create ─────────────────────────────────────────────────────────────
  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) return;
    const bug: Bug = {
      id:          String(Date.now()),
      title:       formTitle.trim(),
      description: formDesc.trim(),
      project_id:  projectId,
      severity:    formSev,
    };
    setBugs([bug, ...bugs]);
    setFormTitle("");
    setFormDesc("");
    setFormSev("major");
    setShowForm(false);
  }

  function cancelForm() {
    setShowForm(false);
    setFormTitle("");
    setFormDesc("");
    setFormSev("major");
  }

  // ── Dismiss ────────────────────────────────────────────────────────────
  function dismissBug(id: string) {
    setBugs(bugs.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-800">Bugs</h2>
          <div className="flex items-center gap-2 mt-0.5">
            {bugs.length === 0 ? (
              <p className="text-sm text-gray-400">No bugs reported</p>
            ) : (
              <>
                <span className="text-sm text-gray-400">{bugs.length} total</span>
                {criticalCount > 0 && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                    {criticalCount} critical
                  </span>
                )}
                {majorCount > 0 && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {majorCount} major
                  </span>
                )}
                {minorCount > 0 && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {minorCount} minor
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
        >
          {showForm ? "Cancel" : "+ Report Bug"}
        </button>
      </div>

      {/* ── Inline form ─────────────────────────────────────────────────── */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-brand-100 rounded-xl p-5 shadow-sm space-y-4"
        >
          <h3 className="text-sm font-semibold text-gray-800">Report a Bug</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Botón no responde en móvil"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Severity
              </label>
              <select
                value={formSev}
                onChange={(e) => setFormSev(e.target.value as BugSeverity)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Description
            </label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={2}
              placeholder="¿Cómo se reproduce el bug?"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={cancelForm}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
            >
              Report
            </button>
          </div>
        </form>
      )}

      {/* ── Bug list ────────────────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-100 py-10 flex items-center justify-center">
          <p className="text-sm text-gray-300">No bugs reported — great work! 🎉</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((bug) => (
            <BugRow key={bug.id} bug={bug} onDismiss={dismissBug} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function BugRow({
  bug,
  onDismiss,
}: {
  bug: Bug;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-start gap-3 hover:shadow-md transition-shadow group">
      {/* Severity badge */}
      <span
        className={`shrink-0 mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${SEVERITY_STYLES[bug.severity]}`}
      >
        {bug.severity}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{bug.title}</p>
        {bug.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{bug.description}</p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(bug.id)}
        className="shrink-0 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        title="Dismiss bug"
      >
        ×
      </button>
    </div>
  );
}
