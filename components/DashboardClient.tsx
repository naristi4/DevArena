"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MOCK_PIPELINE_ITEMS } from "@/lib/pipeline";
import { MOCK_TASKS } from "@/lib/tasks";
import { MOCK_BUGS } from "@/lib/bugs";
import { MOCK_SQUADS } from "@/lib/squads";
import {
  computeMetrics,
  type DateRange,
  type ProjectRow,
  type DashboardMetrics,
} from "@/lib/dashboard";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const HEALTH_BADGE: Record<
  ProjectRow["health"],
  { cls: string; dot: string }
> = {
  "On Track":  { cls: "bg-emerald-500/10 text-emerald-400", dot: "bg-emerald-400" },
  "At Risk":   { cls: "bg-amber-500/10   text-amber-400",   dot: "bg-amber-400"   },
  "Delayed":   { cls: "bg-red-500/10     text-red-400",     dot: "bg-red-400"     },
  "Completed": { cls: "bg-blue-500/10    text-blue-400",    dot: "bg-blue-400"    },
};

// ─── Export helper ────────────────────────────────────────────────────────────

function exportCSV(rows: ProjectRow[]) {
  const header = "Project Name,Lead Developer,Squad,Status,Velocity,Delivery Date\n";
  const body   = rows
    .map(
      (r) =>
        `"${r.title}","${r.lead}","${r.squad}","${r.health}","${r.velocity}","${r.deliveryDate}"`,
    )
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "devarena-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardClient() {
  const { t, language } = useLanguage();

  const [dateRange,   setDateRange]   = useState<DateRange>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd,   setCustomEnd]   = useState("");
  const [squadFilter, setSquadFilter] = useState("");
  const [tableView,   setTableView]   = useState<"active" | "completed">("active");

  const dateRangeOptions: { label: string; value: DateRange }[] = [
    { label: t.dashboard.last7days,   value: "7d"      },
    { label: t.dashboard.last30days,  value: "30d"     },
    { label: t.dashboard.lastQuarter, value: "quarter" },
    { label: t.dashboard.custom,      value: "custom"  },
  ];

  const metrics: DashboardMetrics = useMemo(
    () =>
      computeMetrics(
        MOCK_PIPELINE_ITEMS,
        MOCK_TASKS,
        MOCK_BUGS,
        dateRange,
        squadFilter,
        customStart,
        customEnd,
      ),
    [dateRange, customStart, customEnd, squadFilter],
  );

  const searchQuery = useSearchParams().get("q")?.trim().toLowerCase() ?? "";

  const tableRows =
    tableView === "active"
      ? metrics.projectRows.filter((r) => r.health !== "Completed")
      : metrics.projectRows.filter((r) => r.health === "Completed");

  const filteredRows = searchQuery
    ? tableRows.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery) ||
          r.squad.toLowerCase().includes(searchQuery) ||
          r.lead.toLowerCase().includes(searchQuery),
      )
    : tableRows;

  const maxThroughput = Math.max(...metrics.throughput.map((b) => b.count), 1);
  const maxStage      = Math.max(...metrics.stageDistribution.map((s) => s.count), 1);

  const tableViewLabel = tableView === "active"
    ? (language === "es" ? "Activos" : "Active")
    : (language === "es" ? "Completados" : "Completed");

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t.dashboard.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {t.dashboard.subtitle}
          </p>
        </div>
        <button
          onClick={() => exportCSV(metrics.projectRows)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity shrink-0"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>download</span>
          {t.dashboard.exportReport}
        </button>
      </div>

      {/* ── Global Filters ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">

        {/* Date range tabs */}
        <div className="flex items-center gap-1 bg-primary/5 border border-primary/20 rounded-lg p-1">
          {dateRangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                dateRange === opt.value
                  ? "bg-primary text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom date inputs (shown only for "custom") */}
        {dateRange === "custom" && (
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-0.5">
                {t.dashboard.startDate}
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 text-xs border border-primary/20 bg-primary/5 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all [color-scheme:dark]"
              />
            </div>
            <span className="text-slate-500 text-xs mt-5">→</span>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-0.5">
                {t.dashboard.endDate}
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                min={customStart || undefined}
                className="px-3 py-1.5 text-xs border border-primary/20 bg-primary/5 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all [color-scheme:dark]"
              />
            </div>
            {(customStart || customEnd) && (
              <button
                onClick={() => { setCustomStart(""); setCustomEnd(""); }}
                title="Clear date range"
                className="mt-5 p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
              </button>
            )}
          </div>
        )}

        {/* Squad dropdown */}
        <div className="relative sm:ml-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>groups</span>
          </span>
          <select
            value={squadFilter}
            onChange={(e) => setSquadFilter(e.target.value)}
            className="pl-8 pr-4 py-2 text-xs border border-primary/20 bg-background-dark text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="">{t.dashboard.allSquads}</option>
            {MOCK_SQUADS.map((sq) => (
              <option key={sq.squad_id} value={sq.name}>
                {sq.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── KPI Row 1 ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          label={t.dashboard.activeProjects}
          value={metrics.activeProjects}
          icon="layers"
          sub={`${metrics.wip} ${t.dashboard.activeProjectsDesc}`}
          subCls="text-primary"
        />
        <KpiCard
          label={t.dashboard.projectsDelivered}
          value={metrics.projectsDelivered}
          icon="task_alt"
          sub={t.dashboard.projectsDeliveredDesc}
          subCls="text-emerald-400"
        />
        <KpiCard
          label={t.dashboard.avgDevTime}
          value={metrics.avgDevTimeDays !== null ? `${metrics.avgDevTimeDays}d` : "—"}
          icon="schedule"
          sub={t.dashboard.avgDevTimeDesc}
          subCls="text-slate-500"
        />
        <KpiCard
          label={t.dashboard.tasksCompleted}
          value={metrics.tasksCompleted}
          icon="check_circle"
          sub={t.dashboard.tasksCompletedDesc}
          subCls="text-emerald-400"
        />
      </div>

      {/* ── KPI Row 2 ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <KpiCard
          label={t.dashboard.tasksOnTrack}
          value={`${metrics.tasksOnTrack} / ${metrics.tasksActive}`}
          icon="checklist"
          sub={t.dashboard.tasksOnTrackDesc}
          subCls={
            metrics.tasksActive > 0 && metrics.tasksOnTrack / metrics.tasksActive >= 0.7
              ? "text-emerald-400"
              : "text-amber-400"
          }
        />
        <KpiCard
          label={t.dashboard.estimationAccuracy}
          value={`${metrics.estimationAccuracyPct}%`}
          icon="adjust"
          sub={t.dashboard.estimationAccuracyDesc}
          subCls={metrics.estimationAccuracyPct >= 80 ? "text-emerald-400" : "text-amber-400"}
        />
        <KpiCard
          label={t.dashboard.bugRate}
          value={`${metrics.bugRate} / proj`}
          icon="bug_report"
          sub={`${metrics.criticalBugs} critical · ${metrics.totalBugs} total bugs`}
          subCls={metrics.criticalBugs > 0 ? "text-red-400" : "text-slate-500"}
        />
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Throughput chart */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">{t.dashboard.throughput}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{t.dashboard.throughputDesc}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-white">
                {metrics.throughput.reduce((s, b) => s + b.count, 0)}
              </p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{t.dashboard.doneTasks}</p>
            </div>
          </div>

          {/* WIP badge */}
          <div className="mb-5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>sync</span>
              {t.dashboard.wip}: {metrics.wip} {metrics.wip === 1 ? t.dashboard.project : t.dashboard.projects} {t.dashboard.wipDesc}
            </span>
          </div>

          {/* Bar chart */}
          <div className="flex items-end gap-3 h-36 pt-2">
            {metrics.throughput.map((bucket) => (
              <div key={bucket.label} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-slate-300">{bucket.count}</span>
                <div
                  className="w-full bg-primary rounded-t-md transition-all"
                  style={{
                    height: `${Math.max(4, (bucket.count / maxThroughput) * 96)}px`,
                  }}
                />
                <span className="text-[10px] text-slate-500 text-center leading-tight">
                  {bucket.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline distribution / Bottleneck chart */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-white">{t.dashboard.pipelineDistribution}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.dashboard.bottleneck}{" "}
              <span className="text-primary font-semibold">{metrics.bottleneckStage}</span>
            </p>
          </div>

          <div className="space-y-3.5">
            {metrics.stageDistribution.map((s) => (
              <div key={s.stage} className="flex items-center gap-3">
                <span className="text-[10px] font-medium text-slate-400 w-[90px] shrink-0 truncate">
                  {s.label}
                </span>
                <div className="flex-1 h-5 bg-primary/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      s.label === metrics.bottleneckStage ? "bg-primary" : "bg-primary/35"
                    }`}
                    style={{
                      width: `${Math.max(s.count > 0 ? 6 : 0, (s.count / maxStage) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-300 w-4 text-right shrink-0">
                  {s.count}
                </span>
              </div>
            ))}
          </div>

          {/* Stage legend */}
          <div className="mt-5 pt-4 border-t border-primary/10 flex items-center gap-4 text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary inline-block" />
              {t.dashboard.bottleneck}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary/35 inline-block" />
              {t.dashboard.otherStages}
            </span>
          </div>
        </div>
      </div>

      {/* ── Recent Projects table ─────────────────────────────────────────────── */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-white">{t.dashboard.recentProjects}</h3>
            {searchQuery && (
              <span className="text-xs text-slate-500">
                Results for{" "}
                <span className="text-primary font-medium">"{searchQuery}"</span>
                {" · "}{filteredRows.length} {filteredRows.length !== 1 ? t.dashboard.projects : t.dashboard.project}
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            {(["active", "completed"] as const).map((view) => (
              <button
                key={view}
                onClick={() => setTableView(view)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded uppercase transition-colors ${
                  tableView === view
                    ? "bg-primary text-white"
                    : "bg-primary/10 text-slate-400 hover:text-slate-200"
                }`}
              >
                {view === "active"
                  ? (language === "es" ? "Activos" : "Active")
                  : (language === "es" ? "Completados" : "Completed")}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-primary/10">
                <th className="text-left px-6 py-3.5">{t.dashboard.tableProject}</th>
                <th className="text-left px-6 py-3.5">{t.dashboard.tableLead}</th>
                <th className="text-left px-6 py-3.5">{t.dashboard.tableSquad}</th>
                <th className="text-left px-6 py-3.5">{t.dashboard.tableStatus}</th>
                <th className="text-left px-6 py-3.5">{t.dashboard.tableVelocity}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    {searchQuery
                      ? `${tableView === "active" ? t.dashboard.noActiveProjects : t.dashboard.noCompletedProjects} matching "${searchQuery}".`
                      : (tableView === "active" ? t.dashboard.noActiveProjects : t.dashboard.noCompletedProjects) + "."}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const badge = HEALTH_BADGE[row.health];
                  return (
                    <tr key={row.id} className="hover:bg-primary/5 transition-colors">
                      {/* Project name */}
                      <td className="px-6 py-4 max-w-[260px]">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: "16px" }}
                            >
                              inventory_2
                            </span>
                          </div>
                          <Link
                            href={`/projects/${row.id}`}
                            className="font-medium text-slate-200 hover:text-primary transition-colors truncate"
                          >
                            {row.title}
                          </Link>
                        </div>
                      </td>

                      {/* Lead developer */}
                      <td className="px-6 py-4 text-slate-400 text-sm">{row.lead}</td>

                      {/* Squad */}
                      <td className="px-6 py-4 text-slate-400 text-sm">{row.squad}</td>

                      {/* Status badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${badge.cls}`}
                        >
                          <span className={`size-1.5 rounded-full shrink-0 ${badge.dot}`} />
                          {row.health}
                        </span>
                      </td>

                      {/* Velocity */}
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                        {row.velocity}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-primary/20 bg-primary/5">
          <p className="text-xs text-slate-500">
            {filteredRows.length} {filteredRows.length !== 1 ? t.dashboard.projects : t.dashboard.project}
            {squadFilter && (
              <span className="ml-2 text-slate-600">· {squadFilter}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  sub,
  subCls = "text-slate-500",
}: {
  label:   string;
  value:   string | number;
  icon:    string;
  sub?:    string;
  subCls?: string;
}) {
  return (
    <div className="bg-primary/5 p-5 rounded-xl border border-primary/20 flex flex-col gap-1">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span className="p-2 rounded-lg bg-primary/10 text-primary">
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
            {icon}
          </span>
        </span>
      </div>
      <span className="text-3xl font-black text-white mt-1 tabular-nums">{value}</span>
      {sub && (
        <p className={`text-xs mt-1 font-medium ${subCls}`}>{sub}</p>
      )}
    </div>
  );
}
