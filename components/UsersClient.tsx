"use client";

import { useState, useRef } from "react";
import type { Role, Position } from "@/lib/users";
import { updateUserAvatarUrl } from "@/lib/users";
import Avatar from "@/components/Avatar";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserPublic = {
  id:          string;
  name:        string;
  email:       string;
  role:        Role;
  squad:       string;
  position?:   Position;
  active:      boolean;
  avatar_url?: string;
};

type FilterTab = "all" | "active" | "inactive";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<Role, string> = {
  Admin:          "bg-primary/20 text-primary",
  "Squad Member": "bg-slate-700 text-slate-300",
};

const POSITION_BADGE: Record<Position, string> = {
  Developer: "bg-emerald-500/10 text-emerald-400",
  Architect:  "bg-amber-500/10  text-amber-400",
  PM:         "bg-violet-500/10 text-violet-400",
};

const POSITIONS: Position[] = ["Developer", "Architect", "PM"];
const ROLES:     Role[]     = ["Admin", "Squad Member"];
const DEFAULT_SQUADS       = ["Platform Squad", "Growth Squad", "Core Squad"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE        = 2 * 1024 * 1024; // 2 MB

function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type))
    return "Only JPG, PNG, and WEBP files are accepted.";
  if (file.size > MAX_IMAGE_SIZE)
    return "Image must be smaller than 2 MB.";
  return null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialUsers: Omit<UserPublic, "active">[];
  squads?:      string[];  // available squad names for the squad selector
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UsersClient({ initialUsers, squads: squadsProp }: Props) {
  const SQUADS = squadsProp ?? DEFAULT_SQUADS;
  const { t } = useLanguage();
  // Seed active:true for all initial users
  const [users, setUsers] = useState<UserPublic[]>(
    initialUsers.map((u) => ({ ...u, active: true }))
  );

  // Create form state
  const [showForm,    setShowForm]    = useState(false);
  const [showPass,    setShowPass]    = useState(false);
  const [formName,     setFormName]     = useState("");
  const [formEmail,    setFormEmail]    = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPosition, setFormPosition] = useState<Position>("Developer");
  const [formRole,     setFormRole]     = useState<Role>("Squad Member");
  const [formSquad,    setFormSquad]    = useState("");
  const [formAvatar,   setFormAvatar]   = useState("");
  const [formImgError, setFormImgError] = useState<string | null>(null);
  const formFileRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editName,     setEditName]     = useState("");
  const [editEmail,    setEditEmail]    = useState("");
  const [editPosition, setEditPosition] = useState<Position>("Developer");
  const [editRole,     setEditRole]     = useState<Role>("Squad Member");
  const [editSquad,    setEditSquad]    = useState("");
  const [editAvatar,   setEditAvatar]   = useState("");
  const [editImgError, setEditImgError] = useState<string | null>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  // Derived
  const activeCount   = users.filter((u) => u.active).length;
  const inactiveCount = users.filter((u) => !u.active).length;
  const filteredUsers =
    filterTab === "active"   ? users.filter((u) => u.active) :
    filterTab === "inactive" ? users.filter((u) => !u.active) :
    users;

  // ── Create ───────────────────────────────────────────────────────────────
  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    const newUser: UserPublic = {
      id:         String(Date.now()),
      name:       formName.trim(),
      email:      formEmail.trim(),
      role:       formRole,
      squad:      formSquad,
      position:   formPosition,
      active:     true,
      avatar_url: formAvatar || undefined,
    };

    if (formAvatar) updateUserAvatarUrl(newUser.name, formAvatar);
    setUsers([...users, newUser]);
    cancelForm();
  }

  function cancelForm() {
    setShowForm(false);
    setShowPass(false);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormPosition("Developer");
    setFormRole("Squad Member");
    setFormSquad("");
    setFormAvatar("");
    setFormImgError(null);
  }

  // ── Edit ─────────────────────────────────────────────────────────────────
  function startEdit(user: UserPublic) {
    setEditingId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPosition(user.position ?? "Developer");
    setEditRole(user.role);
    setEditSquad(user.squad);
    setEditAvatar(user.avatar_url ?? "");
    setEditImgError(null);
    // Close create form if open
    setShowForm(false);
  }

  function saveEdit(userId: string) {
    if (!editName.trim() || !editEmail.trim()) return;
    const updatedAvatar = editAvatar || undefined;
    if (editAvatar) updateUserAvatarUrl(editName.trim(), editAvatar);
    setUsers(users.map((u) =>
      u.id === userId
        ? { ...u, name: editName.trim(), email: editEmail.trim(), position: editPosition, role: editRole, squad: editSquad, avatar_url: updatedAvatar }
        : u
    ));
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditAvatar("");
    setEditImgError(null);
  }

  // ── Toggle active ────────────────────────────────────────────────────────
  function toggleActive(userId: string) {
    setUsers(users.map((u) =>
      u.id === userId ? { ...u, active: !u.active } : u
    ));
  }

  return (
    <div className="space-y-6">

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-primary/5 border border-primary/20 rounded-lg p-1">
          {(["all", "active", "inactive"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors capitalize ${
                filterTab === tab
                  ? "bg-primary text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "all"
                ? `All (${users.length})`
                : tab === "active"
                ? `Active (${activeCount})`
                : `Inactive (${inactiveCount})`}
            </button>
          ))}
        </div>

        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-[18px]">
            {showForm ? "close" : "add"}
          </span>
          {showForm ? t.common.cancel : t.settings.users.addUser}
        </button>
      </div>

      {/* ── Create form ───────────────────────────────────────────────────── */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-slate-200">{t.settings.users.addUser}</h3>

          {/* Row 1: Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {t.settings.users.name} <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="w-full px-3 py-2 text-sm border border-primary/20 bg-background-dark text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {t.settings.users.email} <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="e.g. jane@squadtracker.io"
                className="w-full px-3 py-2 text-sm border border-primary/20 bg-background-dark text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-500"
              />
            </div>
          </div>

          {/* Row 2: Password + Position + Role + Squad */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {t.settings.users.password} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  required
                  type={showPass ? "text" : "password"}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-10 text-sm border border-primary/20 bg-background-dark text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPass ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {t.settings.users.position}
              </label>
              <select
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value as Position)}
                className="w-full px-3 py-2 text-sm border border-primary/20 bg-background-dark text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {t.settings.users.role}
              </label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as Role)}
                className="w-full px-3 py-2 text-sm border border-primary/20 bg-background-dark text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {t.settings.users.squad}
              </label>
              <select
                value={formSquad}
                onChange={(e) => setFormSquad(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-primary/20 bg-background-dark text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">{t.settings.users.noSquad}</option>
                {SQUADS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Profile Photo */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Profile Photo
              <span className="ml-1 font-normal text-slate-600">(JPG, PNG, WEBP · max 2 MB)</span>
            </label>
            <div className="flex items-center gap-4">
              <Avatar
                name={formName || "?"}
                avatarUrl={formAvatar}
                size="size-12"
                textSize="text-sm"
              />
              <div className="flex flex-col gap-1">
                <input
                  ref={formFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const err = validateImageFile(file);
                    if (err) { setFormImgError(err); return; }
                    setFormImgError(null);
                    setFormAvatar(URL.createObjectURL(file));
                  }}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => formFileRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium border border-primary/30 text-slate-300 hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    {formAvatar ? "Change Photo" : "Upload Photo"}
                  </button>
                  {formAvatar && (
                    <button
                      type="button"
                      onClick={() => { setFormAvatar(""); if (formFileRef.current) formFileRef.current.value = ""; }}
                      className="px-3 py-1.5 text-xs font-medium border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {formImgError && (
                  <p className="text-[10px] text-red-400">{formImgError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={cancelForm}
              className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-200 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              {t.settings.users.saveUser}
            </button>
          </div>
        </form>
      )}

      {/* ── Users table ───────────────────────────────────────────────────── */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[17%]" />
            <col className="w-[11%]" />
            <col className="w-[13%]" />
            <col className="w-[14%]" />
            <col className="w-[13%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-primary/20 bg-primary/5">
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t.settings.users.name}
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t.settings.users.email}
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t.settings.users.position}
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t.settings.users.role}
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t.settings.users.squad}
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t.settings.users.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10">
            {filteredUsers.map((user) => {
              const isEditing = editingId === user.id;

              return (
                <tr
                  key={user.id}
                  className={`transition-colors ${
                    user.active
                      ? "hover:bg-primary/5"
                      : "opacity-50 hover:opacity-70"
                  }`}
                >
                  {isEditing ? (
                    /* ── Inline edit row ────────────────────────────────── */
                    <>
                      {/* Name + avatar (editable) */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Avatar preview + upload trigger */}
                          <div className="relative shrink-0 group/av cursor-pointer" onClick={() => editFileRef.current?.click()} title="Change photo">
                            <Avatar
                              name={editName || user.name}
                              avatarUrl={editAvatar}
                              size="size-8"
                              textSize="text-xs"
                            />
                            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/av:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-[12px]">photo_camera</span>
                            </div>
                          </div>
                          <input
                            ref={editFileRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const err = validateImageFile(file);
                              if (err) { setEditImgError(err); return; }
                              setEditImgError(null);
                              setEditAvatar(URL.createObjectURL(file));
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-primary/30 bg-background-dark text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            {editImgError && (
                              <p className="text-[10px] text-red-400 mt-0.5">{editImgError}</p>
                            )}
                            {editAvatar && (
                              <button
                                type="button"
                                onClick={() => { setEditAvatar(""); if (editFileRef.current) editFileRef.current.value = ""; }}
                                className="text-[10px] text-red-400/70 hover:text-red-400 mt-0.5"
                              >
                                Remove photo
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email (editable) */}
                      <td className="px-4 py-3">
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-primary/30 bg-background-dark text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </td>

                      {/* Position (editable) */}
                      <td className="px-4 py-3">
                        <select
                          value={editPosition}
                          onChange={(e) => setEditPosition(e.target.value as Position)}
                          className="w-full px-2 py-1.5 text-sm border border-primary/30 bg-background-dark text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          {POSITIONS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </td>

                      {/* Role (editable) */}
                      <td className="px-4 py-3">
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as Role)}
                          className="w-full px-2 py-1.5 text-sm border border-primary/30 bg-background-dark text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>

                      {/* Squad (editable) */}
                      <td className="px-4 py-3">
                        <select
                          value={editSquad}
                          onChange={(e) => setEditSquad(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-primary/30 bg-background-dark text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="">{t.settings.users.noSquad}</option>
                          {SQUADS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>

                      {/* Status (read-only in edit mode) */}
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
                          user.active
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-slate-700 text-slate-500"
                        }`}>
                          {user.active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Save / Cancel */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => saveEdit(user.id)}
                            title="Save changes"
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            {t.settings.users.saveUser}
                          </button>
                          <button
                            onClick={cancelEdit}
                            title="Cancel edit"
                            className="p-1.5 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-primary/10 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    /* ── Read-only row ──────────────────────────────────── */
                    <>
                      {/* Name + avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={user.name}
                            avatarUrl={user.avatar_url}
                            size="size-8"
                            textSize="text-xs"
                            className={user.active ? "" : "opacity-50"}
                          />
                          <span className={`font-medium ${user.active ? "text-slate-200" : "text-slate-500 line-through"}`}>
                            {user.name}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-slate-400 truncate max-w-0">{user.email}</td>

                      {/* Position */}
                      <td className="px-4 py-3">
                        {user.position ? (
                          <span
                            className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${POSITION_BADGE[user.position]}`}
                          >
                            {user.position}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${ROLE_BADGE[user.role]}`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Squad */}
                      <td className="px-4 py-3 text-slate-400 text-sm truncate max-w-0">
                        {user.squad || <span className="text-slate-600">—</span>}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
                          user.active
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-slate-700 text-slate-500"
                        }`}>
                          {user.active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit button */}
                          <button
                            onClick={() => startEdit(user)}
                            title="Edit user"
                            className="p-1.5 text-slate-500 hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>

                          {/* Activate / Deactivate button */}
                          <button
                            onClick={() => toggleActive(user.id)}
                            title={user.active ? "Deactivate user" : "Activate user"}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.active
                                ? "text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                : "text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {user.active ? "person_off" : "person_check"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                  No {filterTab === "all" ? "" : filterTab} users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-primary/20 bg-primary/5">
          <p className="text-xs text-slate-500">
            {filteredUsers.length} {filterTab === "all" ? "" : filterTab + " "}
            {filteredUsers.length === 1 ? "user" : "users"}
            {filterTab === "all" && inactiveCount > 0 && (
              <span className="ml-2 text-slate-600">· {inactiveCount} inactive</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
