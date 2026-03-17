"use client";

import { useState } from "react";
import type { StageConfig } from "@/lib/pipeline";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialStages: StageConfig[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PipelineConfigClient({ initialStages }: Props) {
  const [stages,    setStages]    = useState<StageConfig[]>(initialStages);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [saved,     setSaved]     = useState(false);
  const { t } = useLanguage();

  const CATEGORY_BADGES = [
    { key: "inActive"   as const, label: t.settings.pipeline.active,   cls: "bg-primary/20 text-primary"  },
    { key: "inWip"      as const, label: t.settings.pipeline.wip,      cls: "bg-sky-500/20 text-sky-400"  },
    { key: "inRelevant" as const, label: t.settings.pipeline.relevant, cls: "bg-teal-500/20 text-teal-400"},
  ];

  function startEdit(stage: StageConfig) {
    setEditingId(stage.id);
    setEditLabel(stage.label);
  }

  function saveEdit(id: string) {
    if (!editLabel.trim()) return;
    setStages(stages.map((s) => s.id === id ? { ...s, label: editLabel.trim() } : s));
    setEditingId(null);
    // Show saved toast
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function cancelEdit() { setEditingId(null); }

  return (
    <div className="space-y-6">

      {/* ── Info banner ─────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl">
        <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">info</span>
        <p className="text-xs text-slate-400 leading-relaxed">
          {t.settings.pipeline.description}
        </p>
      </div>

      {/* ── Category legend ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
          {t.settings.pipeline.stageCategories}
        </span>
        {CATEGORY_BADGES.map((b) => (
          <span
            key={b.key}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${b.cls}`}
          >
            {b.label}
          </span>
        ))}
        <span className="text-[10px] text-slate-500 ml-1">
          {t.settings.pipeline.categoryHint}
        </span>
      </div>

      {/* ── Stages table ────────────────────────────────────────────────────── */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[6%]"  />
            <col className="w-[22%]" />
            <col className="w-[28%]" />
            <col className="w-[30%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead>
            <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-primary/20 bg-primary/5">
              <th className="text-center px-4 py-3.5">{t.settings.pipeline.colHash}</th>
              <th className="text-left px-4 py-3.5">{t.settings.pipeline.colStageId}</th>
              <th className="text-left px-4 py-3.5">{t.settings.pipeline.colDisplayLabel}</th>
              <th className="text-left px-4 py-3.5">{t.settings.pipeline.colCategories}</th>
              <th className="text-right px-4 py-3.5">{t.settings.pipeline.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10">
            {stages.map((stage, idx) => {
              const isEditing = editingId === stage.id;

              return (
                <tr key={stage.id} className="hover:bg-primary/5 transition-colors group">

                  {/* Order number */}
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                      {idx + 1}
                    </span>
                  </td>

                  {/* Stage ID */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-600 text-[16px]">account_tree</span>
                      <code className="text-[11px] font-mono text-slate-400 bg-primary/10 px-2 py-0.5 rounded">
                        {stage.id}
                      </code>
                    </div>
                  </td>

                  {/* Display Label */}
                  <td className="px-4 py-4">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(stage.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="w-full px-2.5 py-1.5 text-sm bg-primary/10 border border-primary/30 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ) : (
                      <span className="font-medium text-slate-200">{stage.label}</span>
                    )}
                  </td>

                  {/* Category badges */}
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORY_BADGES.map((b) =>
                        stage[b.key] ? (
                          <span
                            key={b.key}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${b.cls}`}
                          >
                            {b.label}
                          </span>
                        ) : null
                      )}
                      {!stage.inActive && !stage.inWip && !stage.inRelevant && (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(stage.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            {t.settings.pipeline.saveLabel}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 text-xs font-medium text-slate-400 border border-primary/20 rounded-lg hover:text-slate-200 hover:bg-primary/5 transition-colors"
                          >
                            {t.common.cancel}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEdit(stage)}
                          title="Edit label"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-primary/20 bg-primary/5 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {stages.length} stages · Labels are for display only
          </p>
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium animate-pulse">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Label saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
