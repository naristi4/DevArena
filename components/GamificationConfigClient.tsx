"use client";

import { useState } from "react";
import type { SCORING as ScoringType } from "@/lib/gamification";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScoringKey = keyof typeof ScoringType;

type ScoringValues = {
  TASK_COMPLETE: number;
  ON_TIME_BONUS: number;
  DELAY_PENALTY: number;
  BUG_PENALTY:   number;
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialScoring:   ScoringValues;
  initialBugCounts: Record<string, number>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GamificationConfigClient({ initialScoring, initialBugCounts }: Props) {
  const { t } = useLanguage();
  const [scoring,   setScoring]   = useState<ScoringValues>(initialScoring);
  const [bugCounts, setBugCounts] = useState<Record<string, number>>(initialBugCounts);

  const RULE_META: {
    key:         ScoringKey;
    icon:        string;
    iconCls:     string;
    name:        string;
    description: string;
    type:        "bonus" | "penalty";
  }[] = [
    {
      key:         "TASK_COMPLETE",
      icon:        "task_alt",
      iconCls:     "text-emerald-400",
      name:        t.settings.gamification.ruleTask,
      description: t.settings.gamification.ruleTaskDesc,
      type:        "bonus",
    },
    {
      key:         "ON_TIME_BONUS",
      icon:        "bolt",
      iconCls:     "text-primary",
      name:        t.settings.gamification.ruleOnTime,
      description: t.settings.gamification.ruleOnTimeDesc,
      type:        "bonus",
    },
    {
      key:         "DELAY_PENALTY",
      icon:        "schedule",
      iconCls:     "text-amber-400",
      name:        t.settings.gamification.ruleDelay,
      description: t.settings.gamification.ruleDelayDesc,
      type:        "penalty",
    },
    {
      key:         "BUG_PENALTY",
      icon:        "bug_report",
      iconCls:     "text-red-400",
      name:        t.settings.gamification.ruleBug,
      description: t.settings.gamification.ruleBugDesc,
      type:        "penalty",
    },
  ];

  const [editingRule, setEditingRule]   = useState<ScoringKey | null>(null);
  const [editingSquad, setEditingSquad] = useState<string | null>(null);
  const [editValue,    setEditValue]    = useState<string>("");
  const [saved,        setSaved]        = useState(false);

  function showSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // ── Rule edit ─────────────────────────────────────────────────────────────
  function startRuleEdit(key: ScoringKey) {
    setEditingRule(key);
    setEditValue(String(scoring[key]));
    setEditingSquad(null);
  }

  function saveRuleEdit() {
    if (!editingRule) return;
    const num = parseInt(editValue, 10);
    if (isNaN(num)) return;
    setScoring({ ...scoring, [editingRule]: num });
    setEditingRule(null);
    showSaved();
  }

  function cancelRuleEdit() { setEditingRule(null); }

  // ── Bug count edit ────────────────────────────────────────────────────────
  function startBugEdit(squad: string) {
    setEditingSquad(squad);
    setEditValue(String(bugCounts[squad] ?? 0));
    setEditingRule(null);
  }

  function saveBugEdit() {
    if (!editingSquad) return;
    const num = parseInt(editValue, 10);
    if (isNaN(num) || num < 0) return;
    setBugCounts({ ...bugCounts, [editingSquad]: num });
    setEditingSquad(null);
    showSaved();
  }

  function cancelBugEdit() { setEditingSquad(null); }

  return (
    <div className="space-y-8">

      {/* ── Section A: Scoring Rules ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <span className="material-symbols-outlined text-primary text-[18px]">emoji_events</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-200">Scoring Rules</h2>
            <p className="text-xs text-slate-500 mt-0.5">Point values awarded or deducted per event</p>
          </div>
          {saved && (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 font-medium animate-pulse">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Changes saved
            </span>
          )}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[6%]"  />
              <col className="w-[20%]" />
              <col className="w-[40%]" />
              <col className="w-[18%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead>
              <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-primary/20 bg-primary/5">
                <th className="text-center px-4 py-3.5"> </th>
                <th className="text-left px-4 py-3.5">Rule</th>
                <th className="text-left px-4 py-3.5">Description</th>
                <th className="text-left px-4 py-3.5">Points</th>
                <th className="text-right px-4 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {RULE_META.map((rule) => {
                const isEditing = editingRule === rule.key;
                const value     = scoring[rule.key];
                const isBonus   = value > 0;

                return (
                  <tr key={rule.key} className="hover:bg-primary/5 transition-colors">

                    {/* Icon */}
                    <td className="px-4 py-4 text-center">
                      <span className={`material-symbols-outlined text-[20px] ${rule.iconCls}`}>
                        {rule.icon}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-200 text-sm">{rule.name}</p>
                        <span className={`mt-0.5 inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          rule.type === "bonus"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-red-500/10 text-red-500"
                        }`}>
                          {rule.type}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-4 text-slate-400 text-xs leading-relaxed">
                      {rule.description}
                    </td>

                    {/* Points */}
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <input
                          autoFocus
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")  saveRuleEdit();
                            if (e.key === "Escape") cancelRuleEdit();
                          }}
                          className="w-24 px-2.5 py-1.5 text-sm bg-primary/10 border border-primary/30 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center font-bold tabular-nums"
                        />
                      ) : (
                        <span className={`text-xl font-black tabular-nums ${
                          isBonus ? "text-emerald-400" : "text-red-400"
                        }`}>
                          {value > 0 ? `+${value}` : value}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={saveRuleEdit}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              {t.settings.gamification.save}
                            </button>
                            <button
                              onClick={cancelRuleEdit}
                              className="px-3 py-1.5 text-xs font-medium text-slate-400 border border-primary/20 rounded-lg hover:text-slate-200 hover:bg-primary/5 transition-colors"
                            >
                              {t.common.cancel}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startRuleEdit(rule.key)}
                            title="Edit point value"
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

          <div className="px-5 py-3 border-t border-primary/20 bg-primary/5">
            <p className="text-xs text-slate-500">
              Scoring changes apply to new leaderboard calculations — existing mock records are not retroactively updated.
            </p>
          </div>
        </div>
      </div>

      {/* ── Section B: Squad Bug Counts ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-500/10">
            <span className="material-symbols-outlined text-red-400 text-[18px]">bug_report</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-200">Squad Bug Counts</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Open bugs per squad — each bug applies a {scoring.BUG_PENALTY} pt penalty to the squad score
            </p>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[35%]" />
              <col className="w-[22%]" />
              <col className="w-[25%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead>
              <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-primary/20 bg-primary/5">
                <th className="text-left px-5 py-3.5">Squad</th>
                <th className="text-left px-5 py-3.5">Open Bugs</th>
                <th className="text-left px-5 py-3.5">Total Penalty</th>
                <th className="text-right px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {Object.entries(bugCounts).map(([squad, bugs]) => {
                const isEditing = editingSquad === squad;
                const penalty   = bugs * scoring.BUG_PENALTY; // negative

                return (
                  <tr key={squad} className="hover:bg-primary/5 transition-colors">

                    {/* Squad name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="size-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined text-[15px]">groups</span>
                        </span>
                        <span className="font-medium text-slate-200">{squad}</span>
                      </div>
                    </td>

                    {/* Open bugs (editable) */}
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <input
                          autoFocus
                          type="number"
                          min={0}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")  saveBugEdit();
                            if (e.key === "Escape") cancelBugEdit();
                          }}
                          className="w-20 px-2.5 py-1.5 text-sm bg-primary/10 border border-primary/30 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center font-bold tabular-nums"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center justify-center size-7 rounded-full text-xs font-bold ${
                            bugs === 0
                              ? "bg-emerald-500/10 text-emerald-400"
                              : bugs <= 2
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-red-500/10 text-red-400"
                          }`}>
                            {bugs}
                          </span>
                          <span className="text-slate-500 text-xs">bugs</span>
                        </div>
                      )}
                    </td>

                    {/* Total penalty */}
                    <td className="px-5 py-4">
                      <span className={`text-sm font-bold tabular-nums ${
                        penalty < 0 ? "text-red-400" : "text-slate-500"
                      }`}>
                        {penalty === 0 ? "—" : penalty}
                        {penalty < 0 && <span className="text-xs font-normal text-slate-500 ml-1">pts</span>}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={saveBugEdit}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              {t.settings.gamification.save}
                            </button>
                            <button
                              onClick={cancelBugEdit}
                              className="px-3 py-1.5 text-xs font-medium text-slate-400 border border-primary/20 rounded-lg hover:text-slate-200 hover:bg-primary/5 transition-colors"
                            >
                              {t.common.cancel}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startBugEdit(squad)}
                            title="Edit bug count"
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

          <div className="px-5 py-3 border-t border-primary/20 bg-primary/5">
            <p className="text-xs text-slate-500">
              Bug penalty: {scoring.BUG_PENALTY} pts × bug count · Total penalty updates live as you edit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
