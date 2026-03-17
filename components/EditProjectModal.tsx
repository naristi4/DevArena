"use client";

import { useEffect, useState } from "react";
import type { PipelineItem, PipelineImpact } from "@/lib/pipeline";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const IMPACT_OPTIONS: PipelineImpact[] = [
  "Eficiencias/margen",
  "Calidad",
  "Product Market Fit",
  "Saldar deuda/sistematización",
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  item:    PipelineItem;
  squads:  string[];
  onSave:  (updated: PipelineItem) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditProjectModal({ item, squads, onSave, onClose }: Props) {
  const { t } = useLanguage();
  const [title,        setTitle]        = useState(item.title);
  const [description,  setDescription]  = useState(item.description);
  const [squad,        setSquad]        = useState(item.squad);
  const [impact,       setImpact]       = useState<PipelineImpact>(item.impact);
  const [startDate,       setStartDate]       = useState(item.start_date);
  const [targetEndDate,   setTargetEndDate]   = useState(item.target_end_date);
  const [completionDate,  setCompletionDate]  = useState(item.completion_date ?? "");
  const [prdUrl,          setPrdUrl]          = useState(item.prd_url);
  const [oddUrl,          setOddUrl]          = useState(item.odd_url);
  const [trdUrl,          setTrdUrl]          = useState(item.trd_url ?? "");

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      ...item,
      title:                   title.trim(),
      description:             description.trim(),
      squad,
      impact,
      start_date:      startDate,
      target_end_date: targetEndDate,
      completion_date: completionDate || undefined,
      prd_url:         prdUrl.trim(),
      odd_url:         oddUrl.trim(),
      trd_url:         trdUrl.trim(),
    });
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card */}
      <div className="w-full max-w-2xl bg-slate-900 border border-primary/20 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <span className="material-symbols-outlined text-primary text-[20px]">edit_note</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{t.editProject.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{item.id} · {item.status.replace(/_/g, " ")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              {t.editProject.titleRequired}
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-500 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              {t.editProject.description}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-500 transition-all"
            />
          </div>

          {/* Squad + Impact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                {t.editProject.squad}
              </label>
              <select
                value={squad}
                onChange={(e) => setSquad(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">{t.editProject.noSquad}</option>
                {squads.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                {t.editProject.impact}
              </label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value as PipelineImpact)}
                className="w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                {IMPACT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date + Target End Date + Completion Date */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                {t.editProject.startDate}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                {t.editProject.targetEndDate}
              </label>
              <input
                type="date"
                value={targetEndDate}
                onChange={(e) => setTargetEndDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                {t.editProject.completionDate}
                <span className="ml-1 text-slate-600 font-normal normal-case">{t.editProject.completionOptional}</span>
              </label>
              <input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          {/* PRD URL + ODD URL + TRD URL */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                {t.editProject.prdUrl}
              </label>
              <input
                type="url"
                value={prdUrl}
                onChange={(e) => setPrdUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                {t.editProject.oddUrl}
              </label>
              <input
                type="url"
                value={oddUrl}
                onChange={(e) => setOddUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                {t.editProject.trdUrl}
              </label>
              <input
                type="url"
                value={trdUrl}
                onChange={(e) => setTrdUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-500 transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-primary/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium border border-primary/20 text-slate-400 hover:text-slate-200 hover:bg-primary/5 rounded-lg transition-colors"
            >
              {t.editProject.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              {t.editProject.saveChanges}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
