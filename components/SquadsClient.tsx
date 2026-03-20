"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Squad } from "@/lib/squads";
import type { Role } from "@/lib/users";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Local Types ──────────────────────────────────────────────────────────────

type UserPublic = {
  id:      string;
  name:    string;
  email:   string;
  role:    Role;
  squad:   string;
  squadId: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-primary/20 text-primary",
  "bg-emerald-500/20 text-emerald-400",
  "bg-amber-500/20 text-amber-400",
  "bg-rose-500/20 text-rose-400",
  "bg-sky-500/20 text-sky-400",
];

function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialSquads: Squad[];
  initialUsers:  UserPublic[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SquadsClient({ initialSquads, initialUsers }: Props) {
  const { t } = useLanguage();
  const router = useRouter();

  const [squads,     setSquads]     = useState<Squad[]>(initialSquads);
  const [users,      setUsers]      = useState<UserPublic[]>(initialUsers);
  const [showForm,   setShowForm]   = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [error,      setError]      = useState("");

  useEffect(() => { setSquads(initialSquads); }, [initialSquads]);
  useEffect(() => { setUsers(initialUsers); },  [initialUsers]);

  // ── Create form state ──────────────────────────────────────────────────────
  const [formName,   setFormName]   = useState("");
  const [formDesc,   setFormDesc]   = useState("");
  const [formLeadId, setFormLeadId] = useState("");

  // ── Edit form state ────────────────────────────────────────────────────────
  const [editName,   setEditName]   = useState("");
  const [editDesc,   setEditDesc]   = useState("");
  const [editLeadId, setEditLeadId] = useState("");

  // ── Create ─────────────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setError("");
    try {
      const res = await fetch("/api/squads", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:        formName.trim(),
          description: formDesc.trim(),
          leadId:      formLeadId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create squad");
        return;
      }
      const created: Squad = await res.json();
      setSquads([created, ...squads]);
      setFormName(""); setFormDesc(""); setFormLeadId("");
      setShowForm(false);
      router.refresh();
    } catch {
      setError("Network error — please try again");
    }
  }

  // ── Edit ───────────────────────────────────────────────────────────────────
  function startEdit(sq: Squad) {
    setEditingId(sq.id);
    setEditName(sq.name);
    setEditDesc(sq.description);
    setEditLeadId(sq.leadId ?? "");
  }

  async function saveEdit(id: string) {
    setError("");
    try {
      const res = await fetch(`/api/squads/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:        editName.trim(),
          description: editDesc.trim(),
          leadId:      editLeadId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update squad");
        return;
      }
      const updated: Squad = await res.json();
      setSquads(squads.map((sq) => sq.id === id ? updated : sq));
      setEditingId(null);
      router.refresh();
    } catch {
      setError("Network error — please try again");
    }
  }

  function cancelEdit() { setEditingId(null); }

  // ── Members ────────────────────────────────────────────────────────────────
  async function assignUser(userId: string, squadId: string, squadName: string) {
    setError("");
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ squadId }),
      });
      if (!res.ok) {
        setError("Failed to assign member");
        return;
      }
      setUsers(users.map((u) => u.id === userId ? { ...u, squad: squadName, squadId } : u));
      router.refresh();
    } catch {
      setError("Network error — please try again");
    }
  }

  async function removeUser(userId: string) {
    setError("");
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ squadId: null }),
      });
      if (!res.ok) {
        setError("Failed to remove member");
        return;
      }
      setUsers(users.map((u) => u.id === userId ? { ...u, squad: "", squadId: null } : u));
      router.refresh();
    } catch {
      setError("Network error — please try again");
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setError("");
    try {
      const res = await fetch(`/api/squads/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Failed to delete squad");
        return;
      }
      const sq = squads.find((s) => s.id === id);
      setSquads(squads.filter((s) => s.id !== id));
      if (sq) {
        setUsers(users.map((u) => u.squad === sq.name ? { ...u, squad: "", squadId: null } : u));
      }
      router.refresh();
    } catch {
      setError("Network error — please try again");
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Error banner ─────────────────────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5">
          {error}
        </p>
      )}

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{squads.length} squad{squads.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-[16px]">{showForm ? "close" : "add"}</span>
          {showForm ? t.common.cancel : t.settings.squads.addSquad}
        </button>
      </div>

      {/* ── Create form ─────────────────────────────────────────────────────── */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">group_add</span>
            {t.settings.squads.addSquad}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                {t.settings.squads.squadName} <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Infrastructure Squad"
                className="w-full px-3 py-2 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Description
              </label>
              <input
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="What does this squad do?"
                className="w-full px-3 py-2 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Squad Lead
              </label>
              <select
                value={formLeadId}
                onChange={(e) => setFormLeadId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-primary/5 border border-primary/20 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">— No lead —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-primary/20">
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormName(""); setFormDesc(""); setFormLeadId(""); }}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              {t.settings.squads.saveSquad}
            </button>
          </div>
        </form>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[4%]"  />  {/* expand toggle */}
            <col className="w-[19%]" />  {/* Squad */}
            <col className="w-[26%]" />  {/* Description */}
            <col className="w-[17%]" />  {/* Squad Lead */}
            <col className="w-[20%]" />  {/* Members */}
            <col className="w-[14%]" />  {/* Actions */}
          </colgroup>
          <thead>
            <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-primary/20">
              <th className="px-3 py-3.5" />
              <th className="text-left px-5 py-3.5">{t.settings.squads.title}</th>
              <th className="text-left px-5 py-3.5">Description</th>
              <th className="text-left px-5 py-3.5">Squad Lead</th>
              <th className="text-left px-5 py-3.5">{t.settings.squads.members}</th>
              <th className="text-right px-5 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10">
            {squads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                  {t.settings.squads.noSquads}
                </td>
              </tr>
            ) : (
              squads.map((sq) => {
                const members    = users.filter((u) => u.squad === sq.name);
                const unassigned = users.filter((u) => u.squad !== sq.name);
                const isEditing  = editingId === sq.id;
                const isExpanded = expandedId === sq.id;

                return [
                  // ── Data row ──────────────────────────────────────────────
                  <tr
                    key={`row-${sq.id}`}
                    className="hover:bg-primary/5 transition-colors group"
                  >
                    {/* Expand toggle (far left) */}
                    <td className="px-3 py-4 text-center">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : sq.id)}
                        title={isExpanded ? "Collapse members" : "Manage members"}
                        className="p-1 rounded-md text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isExpanded ? "expand_less" : "chevron_right"}
                        </span>
                      </button>
                    </td>

                    {/* Squad name */}
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm bg-primary/10 border border-primary/30 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <span className="size-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-[15px]">groups</span>
                          </span>
                          <span className="font-medium text-slate-200 truncate">{sq.name}</span>
                        </div>
                      )}
                    </td>

                    {/* Description */}
                    <td className="px-5 py-4 max-w-0">
                      {isEditing ? (
                        <input
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm bg-primary/10 border border-primary/30 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        <span className="text-slate-400 text-sm truncate block">{sq.description || "—"}</span>
                      )}
                    </td>

                    {/* Squad Lead */}
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <select
                          value={editLeadId}
                          onChange={(e) => setEditLeadId(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm bg-primary/10 border border-primary/30 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">— No lead —</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      ) : sq.squad_lead ? (
                        <div className="flex items-center gap-2">
                          <span className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarColor(sq.squad_lead)}`}>
                            {initials(sq.squad_lead)}
                          </span>
                          <span className="text-slate-300 text-sm truncate">{sq.squad_lead}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-sm">—</span>
                      )}
                    </td>

                    {/* Members avatars */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        {members.slice(0, 3).map((m) => (
                          <span
                            key={m.id}
                            title={m.name}
                            className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarColor(m.name)}`}
                          >
                            {initials(m.name)}
                          </span>
                        ))}
                        {members.length > 3 && (
                          <span className="text-[10px] text-slate-500 ml-1">
                            +{members.length - 3}
                          </span>
                        )}
                        {members.length === 0 && (
                          <span className="text-slate-600 text-xs">No members</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(sq.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              {t.settings.squads.saveSquad}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1.5 text-xs font-medium text-slate-400 border border-primary/20 rounded-lg hover:text-slate-200 hover:bg-primary/5 transition-colors"
                            >
                              {t.common.cancel}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(sq)}
                              title="Edit squad"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(sq.id)}
                              title="Delete squad"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>,

                  // ── Expandable members panel ──────────────────────────────
                  isExpanded && (
                    <tr key={`expand-${sq.id}`}>
                      <td colSpan={6} className="px-5 py-4 bg-primary/[0.03] border-t border-primary/10">
                        <div className="space-y-3">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                            Members ({members.length})
                          </p>

                          {/* Member list */}
                          {members.length === 0 ? (
                            <p className="text-xs text-slate-600">No members assigned yet.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {members.map((m) => (
                                <div
                                  key={m.id}
                                  className="flex items-center gap-2 px-2.5 py-1.5 bg-primary/10 border border-primary/20 rounded-lg"
                                >
                                  <span className={`size-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${avatarColor(m.name)}`}>
                                    {initials(m.name)}
                                  </span>
                                  <span className="text-xs font-medium text-slate-300">{m.name}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                    m.role === "Admin"
                                      ? "bg-purple-500/20 text-purple-400"
                                      : "bg-primary/20 text-primary"
                                  }`}>
                                    {m.role}
                                  </span>
                                  <button
                                    onClick={() => removeUser(m.id)}
                                    title="Remove from squad"
                                    className="text-slate-600 hover:text-red-400 transition-colors ml-1"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">close</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add member */}
                          {unassigned.length > 0 && (
                            <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
                              <span className="text-xs text-slate-500 shrink-0">Add member:</span>
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    assignUser(e.target.value, sq.id, sq.name);
                                    e.target.value = "";
                                  }
                                }}
                                className="px-3 py-1.5 text-xs bg-primary/5 border border-primary/20 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                              >
                                <option value="" disabled>Select a user…</option>
                                {unassigned.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name} ({u.role})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                ];
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
