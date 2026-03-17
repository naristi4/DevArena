"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AppNotification } from "@/lib/notifications";
import { getDeveloperLeaderboard, getSquadLeaderboard } from "@/lib/gamification";

// ─── Context shape ────────────────────────────────────────────────────────────

interface NotificationContextType {
  notifications:   AppNotification[];
  unreadCount:     number;
  addNotification: (n: Omit<AppNotification, "id" | "at" | "read">) => void;
  markAllRead:     () => void;
  markRead:        (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications:   [],
  unreadCount:     0,
  addNotification: () => {},
  markAllRead:     () => {},
  markRead:        () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // ── Weekly awards notification (fires once per week on first app visit) ──────
  useEffect(() => {
    const STORAGE_KEY = "weeklyAwardsLastNotified";

    // Compute last Monday's ISO date string (YYYY-MM-DD)
    const today = new Date();
    const dow = today.getDay(); // 0 = Sunday
    const daysToLastMonday = dow === 0 ? 6 : dow - 1;
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysToLastMonday);
    const lastMondayStr = lastMonday.toISOString().slice(0, 10);

    // Already notified this week → skip
    if (localStorage.getItem(STORAGE_KEY) === lastMondayStr) return;

    const topDev   = getDeveloperLeaderboard(true)[0];
    const topSquad = getSquadLeaderboard(true)[0];
    if (!topDev && !topSquad) return;

    // Week label: Mon – Sun of the evaluated week
    const prevSunday = new Date(lastMonday);
    prevSunday.setDate(lastMonday.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const weekLabel = `${fmt(lastMonday)} – ${fmt(prevSunday)}`;

    const award: AppNotification = {
      id:      crypto.randomUUID(),
      type:    "weekly_awards",
      title:   "🏆 Weekly DevArena Awards Are Ready!",
      message: `Results for ${weekLabel}: ${topDev?.name ?? "—"} led with ${topDev?.totalPoints ?? 0} pts · ${topSquad?.squad ?? "—"} was the top squad.`,
      link:    "/leaderboard",
      at:      new Date().toISOString(),
      read:    false,
    };

    setNotifications((prev) => [award, ...prev]);
    localStorage.setItem(STORAGE_KEY, lastMondayStr);
  }, []);

  const addNotification = useCallback(
    (n: Omit<AppNotification, "id" | "at" | "read">) => {
      const next: AppNotification = {
        ...n,
        id:   crypto.randomUUID(),
        at:   new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [next, ...prev]);
    },
    [],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markAllRead, markRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  return useContext(NotificationContext);
}
