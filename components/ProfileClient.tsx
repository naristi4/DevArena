"use client";

import { useRef, useState }   from "react";
import Link                   from "next/link";
import Avatar                 from "@/components/Avatar";
import { useLanguage }        from "@/contexts/LanguageContext";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  userId:      string;
  email:       string;
  initialName: string;
  role:        string;
  squad:       string;
  avatarUrl:   string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileClient({
  userId,
  email,
  initialName,
  role,
  squad,
  avatarUrl,
}: Props) {
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Profile section state ─────────────────────────────────────────────────
  const [name,          setName]          = useState(initialName);
  const [localAvUrl,    setLocalAvUrl]    = useState(avatarUrl);
  const [profileMsg,    setProfileMsg]    = useState<{ text: string; ok: boolean } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Password section state ────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg,     setPwMsg]     = useState<{ text: string; ok: boolean } | null>(null);
  const [pwSaving,  setPwSaving]  = useState(false);

  // ── Avatar upload ─────────────────────────────────────────────────────────
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setLocalAvUrl(dataUrl);
      // Persist to DB
      await fetch(`/api/users/${userId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ avatarUrl: dataUrl }),
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  // ── Profile save ──────────────────────────────────────────────────────────
  async function handleProfileSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setProfileSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: trimmed }),
      });
      setProfileMsg({ text: res.ok ? t.profile.profileUpdated : "Failed to save changes", ok: res.ok });
    } catch {
      setProfileMsg({ text: "Failed to save changes", ok: false });
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileMsg(null), 3000);
    }
  }

  // ── Password update ───────────────────────────────────────────────────────
  async function handlePasswordUpdate() {
    if (newPw !== confirmPw) {
      setPwMsg({ text: t.profile.passwordMismatch, ok: false });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/password`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (res.ok) {
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
        setPwMsg({ text: t.profile.passwordUpdated, ok: true });
      } else {
        const data = await res.json();
        const wrong = data?.error === "Incorrect current password";
        setPwMsg({ text: wrong ? t.profile.incorrectPassword : (data?.error ?? "Failed to update password"), ok: false });
      }
    } catch {
      setPwMsg({ text: "Failed to update password", ok: false });
    } finally {
      setPwSaving(false);
      setTimeout(() => setPwMsg(null), 3000);
    }
  }

  const pwAllFilled = currentPw.length > 0 && newPw.length > 0 && confirmPw.length > 0;

  // ── Role display label ────────────────────────────────────────────────────
  const roleLabel = role === "SquadMember" ? "Squad Member" : role;

  // ── Input style helper ────────────────────────────────────────────────────
  const inputCls =
    "w-full bg-primary/5 border border-primary/20 text-slate-200 text-sm rounded-lg px-3 py-2 " +
    "focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* ── Back link + Page title ─────────────────────────────────────────── */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t.nav.dashboard}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {t.profile.title}
        </h1>
      </div>

      {/* ── Section 1: Profile Information ────────────────────────────────── */}
      <div className="bg-background-dark border border-primary/20 rounded-2xl p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-200 mb-6">
          <span className="material-symbols-outlined text-primary text-[20px]">person</span>
          {t.profile.profileInfo}
        </h2>

        <div className="flex gap-6">
          {/* ── Avatar column ───────────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <Avatar
              name={name || initialName}
              avatarUrl={localAvUrl}
              size="size-20"
              textSize="text-xl"
              className="border-2 border-primary/30"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">upload</span>
              {t.profile.uploadAvatar}
            </button>
          </div>

          {/* ── Form column ──────────────────────────────────────────────────── */}
          <div className="flex-1 space-y-4">

            {/* Name — editable */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1.5">
                {t.profile.name}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Email — read-only */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                {t.profile.email}
                <span className="material-symbols-outlined text-[12px] text-slate-600">lock</span>
              </label>
              <div className="w-full bg-primary/5 border border-primary/10 text-slate-500 text-sm rounded-lg px-3 py-2 select-none cursor-default">
                {email}
              </div>
            </div>

            {/* Role + Squad — read-only badges */}
            <div className="flex gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                  {t.profile.role}
                  <span className="material-symbols-outlined text-[12px] text-slate-600">lock</span>
                </label>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                  {roleLabel}
                </span>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                  {t.profile.squad}
                  <span className="material-symbols-outlined text-[12px] text-slate-600">lock</span>
                </label>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/60 text-slate-300 border border-slate-600/40">
                  {squad || "—"}
                </span>
              </div>
            </div>

            {/* Save button + feedback */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleProfileSave}
                disabled={!name.trim() || profileSaving}
                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {profileSaving ? "Saving…" : t.profile.saveChanges}
              </button>
              {profileMsg && (
                <span
                  className={`text-xs font-medium ${
                    profileMsg.ok ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {profileMsg.text}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Change Password ─────────────────────────────────────── */}
      <div className="bg-background-dark border border-primary/20 rounded-2xl p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-200 mb-6">
          <span className="material-symbols-outlined text-primary text-[20px]">lock</span>
          {t.profile.changePassword}
        </h2>

        <div className="space-y-4 max-w-sm">

          {/* Current password */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {t.profile.currentPassword}
            </label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {t.profile.newPassword}
            </label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Confirm new password */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {t.profile.confirmPassword}
            </label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Update button + feedback */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handlePasswordUpdate}
              disabled={!pwAllFilled || pwSaving}
              className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {pwSaving ? "Updating…" : t.profile.updatePassword}
            </button>
            {pwMsg && (
              <span
                className={`text-xs font-medium ${
                  pwMsg.ok ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {pwMsg.text}
              </span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
