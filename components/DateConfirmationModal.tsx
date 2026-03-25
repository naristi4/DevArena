"use client";

import { useState } from "react";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  title:      string;
  message:    string;
  fieldLabel: string;
  onConfirm:  (date: string) => void;
  onCancel:   () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DateConfirmationModal({
  title,
  message,
  fieldLabel,
  onConfirm,
  onCancel,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm bg-slate-900 border border-primary/20 rounded-2xl shadow-2xl shadow-black/50">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-primary/10">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[18px]">event</span>
            <h2 className="text-sm font-bold text-slate-200">{title}</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
        </div>

        {/* Date input */}
        <div className="px-6 py-4">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            {fieldLabel} <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            autoFocus
            className="w-full px-3 py-2 text-sm border border-primary/20 bg-slate-800 text-slate-100 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent [color-scheme:dark]"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-primary/20
                       rounded-lg hover:bg-primary/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { if (date) onConfirm(date); }}
            disabled={!date}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-primary
                       rounded-lg hover:bg-primary/90 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[16px]">check</span>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
