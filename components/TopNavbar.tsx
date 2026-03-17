"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useNotifications } from "@/components/NotificationContext";
import Avatar from "@/components/Avatar";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Component ────────────────────────────────────────────────────────────────

export default function TopNavbar() {
  const { data: session }                          = useSession();
  const isAdmin = session?.user?.role === "Admin";
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const [showDropdown, setShowDropdown]            = useState(false);
  const dropdownRef                                = useRef<HTMLDivElement>(null);
  const { language, setLanguage, t } = useLanguage();

  const router = useRouter();

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hrs   = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (mins < 1)  return t.time.justNow;
    if (mins < 60) return `${mins}${t.time.minutesAgo}`;
    if (hrs  < 24) return `${hrs}${t.time.hoursAgo}`;
    return `${days}${t.time.daysAgo}`;
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDropdown]);

  return (
    <header className="h-16 border-b border-primary/20 bg-background-dark flex items-center justify-end px-8 shrink-0">

      {/* Right actions */}
      <div className="flex items-center gap-3">

        {/* Language selector */}
        <div className="flex items-center bg-primary/10 rounded-lg p-0.5 gap-0.5">
          {(["en", "es"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors uppercase ${
                language === lang
                  ? "bg-primary text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Notifications bell + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="relative p-2 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <>
                {/* dot */}
                <span className="absolute top-1.5 right-1.5 size-2 bg-primary rounded-full ring-2 ring-background-dark" />
                {/* count badge */}
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </>
            )}
          </button>

          {/* Dropdown panel */}
          {showDropdown && (
            <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-primary/20 rounded-xl shadow-2xl z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-200">{t.notifications.title}</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    {t.notifications.markAllRead}
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="max-h-80 overflow-y-auto divide-y divide-primary/10">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <span className="material-symbols-outlined text-slate-600 text-[32px] block mb-2">
                      notifications_none
                    </span>
                    <p className="text-sm text-slate-500">{t.notifications.empty}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {t.notifications.emptyHint}
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markRead(n.id);
                        if (n.type === "weekly_awards" && n.link) {
                          router.push(n.link);
                          setShowDropdown(false);
                        }
                      }}
                      className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-primary/5 transition-colors ${
                        !n.read ? "bg-primary/5" : ""
                      }`}
                    >
                      {n.type === "weekly_awards" ? (
                        <div className="size-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-amber-400 text-[16px]">emoji_events</span>
                        </div>
                      ) : (
                        <Avatar name={n.from ?? "?"} size="size-8" textSize="text-xs" />
                      )}
                      <div className="flex-1 min-w-0">
                        {n.type === "weekly_awards" && n.title && (
                          <p className="text-xs font-semibold text-amber-300 mb-0.5">{n.title}</p>
                        )}
                        <p className="text-xs text-slate-200 leading-relaxed">{n.message}</p>
                        <p suppressHydrationWarning className="text-[10px] text-slate-500 mt-0.5">{relativeTime(n.at)}</p>
                      </div>
                      {!n.read && (
                        <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-primary/20 text-center">
                  <button
                    onClick={() => { markAllRead(); setShowDropdown(false); }}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {t.notifications.dismissAll}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings — Admin only */}
        {isAdmin && (
          <Link
            href="/settings"
            className="p-2 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </Link>
        )}

        {/* Divider */}
        <div className="h-8 w-px bg-primary/20 mx-1" />

        {/* User avatar */}
        {session?.user?.name && (
          <Avatar
            name={session.user.name}
            size="size-9"
            textSize="text-xs"
            className="border border-primary/30"
          />
        )}
      </div>
    </header>
  );
}
