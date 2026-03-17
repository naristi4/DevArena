"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Avatar from "@/components/Avatar";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Nav Types ────────────────────────────────────────────────────────────────

interface NavChild {
  label: string;
  href:  string;
  icon:  string; // Material Symbols icon name
}

interface NavItem {
  label:     string;
  href:      string;
  icon:      string; // Material Symbols icon name
  children?: NavChild[];
}

// ─── Nav Items ────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",   href: "/",            icon: "dashboard"     },
  { label: "Pipeline",    href: "/pipeline",    icon: "rocket_launch" },
  { label: "Leaderboard", href: "/leaderboard", icon: "leaderboard"   },
  {
    label: "Settings",
    href:  "/settings",
    icon:  "settings",
    children: [
      { label: "Users",        href: "/settings/users",        icon: "person"        },
      { label: "Squads",       href: "/settings/squads",       icon: "groups"        },
      { label: "Pipeline",     href: "/settings/pipeline",     icon: "account_tree"  },
      { label: "Gamification", href: "/settings/gamification", icon: "military_tech" },
    ],
  },
];

const STORAGE_KEY = "sidebarCollapsed";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the set of group hrefs that contain the given pathname */
function getActiveGroups(pathname: string): Set<string> {
  const active = new Set<string>();
  for (const item of NAV_ITEMS) {
    if (
      item.children &&
      (pathname === item.href || pathname.startsWith(item.href + "/"))
    ) {
      active.add(item.href);
    }
  }
  return active;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <div className="
      absolute left-full top-1/2 -translate-y-1/2 ml-3
      px-2.5 py-1.5 bg-slate-800 border border-primary/20
      text-white text-xs font-medium rounded-lg whitespace-nowrap
      opacity-0 group-hover:opacity-100 pointer-events-none
      transition-opacity duration-150 z-50 shadow-lg
    ">
      {children}
      {/* Arrow pointing left */}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "Admin";
  const { t } = useLanguage();

  const NAV_ITEM_LABELS: Record<string, string> = {
    "/":                      t.nav.dashboard,
    "/pipeline":              t.nav.pipeline,
    "/leaderboard":           t.nav.leaderboard,
    "/settings":              t.nav.settings,
    "/settings/users":        t.nav.users,
    "/settings/squads":       t.nav.squads,
    "/settings/pipeline":     t.nav.pipelineConfig,
    "/settings/gamification": t.nav.gamification,
  };

  // ── Collapse state — persisted in localStorage ───────────────────────────────
  // Start with false so server and client produce identical HTML.
  // Restore the persisted value after hydration to avoid a mismatch.
  const [collapsed, setCollapsed] = useState<boolean>(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(STORAGE_KEY) === "true"); }
    catch { /* noop */ }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* noop */ }
      return next;
    });
  }

  // Cmd / Ctrl + B keyboard shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Open groups ──────────────────────────────────────────────────────────────
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => getActiveGroups(pathname),
  );

  // Auto-expand a group when navigating into one of its child routes
  useEffect(() => {
    setOpenGroups((prev) => {
      const active = getActiveGroups(pathname);
      let changed = false;
      const next = new Set(prev);
      active.forEach((href) => {
        if (!next.has(href)) { next.add(href); changed = true; }
      });
      return changed ? next : prev;
    });
  }, [pathname]);

  function toggleGroup(href: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  }

  const navItems = isAdmin
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => item.href !== "/settings");

  return (
    <aside
      className={`${
        collapsed ? "w-[68px]" : "w-64"
      } bg-background-dark border-r border-primary/20 flex flex-col shrink-0 transition-[width] duration-300 ease-in-out`}
    >

      {/* ── Logo / Header ──────────────────────────────────────────────────────── */}
      <div className="h-16 flex items-center border-b border-primary/20 shrink-0">
        {collapsed ? (
          /* Collapsed: single chevron centered */
          <div className="w-full flex justify-center">
            <button
              onClick={toggleCollapsed}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-primary/10 transition-colors"
              title={t.nav.expandHint}
            >
              <span className="material-symbols-outlined text-[22px]">chevron_right</span>
            </button>
          </div>
        ) : (
          /* Expanded: logo + title + collapse button */
          <div className="flex items-center gap-3 px-6 w-full">
            <div className="size-8 bg-primary rounded flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
            </div>
            <h2 className="text-white text-lg font-bold tracking-tight flex-1">{t.nav.devArena}</h2>
            <button
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-primary/10 transition-colors shrink-0"
              title={t.nav.collapseHint}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Nav ────────────────────────────────────────────────────────────────── */}
      <nav className={`flex-1 py-4 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
        {navItems.map((item) => {
          const isParentActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          // ── Collapsed: icon only + tooltip ─────────────────────────────────
          if (collapsed) {
            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={`flex items-center justify-center p-2.5 rounded-lg transition-colors ${
                    isParentActive
                      ? "bg-primary text-white"
                      : "text-slate-400 hover:bg-primary/10 hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </Link>
                <Tooltip>{NAV_ITEM_LABELS[item.href] ?? item.label}</Tooltip>
              </div>
            );
          }

          // ── Group item (has children) ───────────────────────────────────────
          if (item.children) {
            const isOpen = openGroups.has(item.href);
            return (
              <div key={item.href}>
                {/* Toggle button — expands/collapses the submenu */}
                <button
                  onClick={() => toggleGroup(item.href)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isParentActive
                      ? "bg-primary text-white"
                      : "text-slate-400 hover:bg-primary/10 hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="flex-1 text-left">{NAV_ITEM_LABELS[item.href] ?? item.label}</span>
                  {/* Chevron — rotates 180° when open */}
                  <span
                    className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                      isOpen ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Animated children panel — grid-rows trick: 0fr ↔ 1fr */}
                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="mt-1 space-y-0.5 pl-3 pb-1">
                      {item.children.map((child) => {
                        const childActive =
                          pathname === child.href ||
                          pathname.startsWith(child.href + "/");
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              childActive
                                ? "bg-primary text-white"
                                : "text-slate-500 hover:bg-primary/10 hover:text-slate-200"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">{child.icon}</span>
                            {NAV_ITEM_LABELS[child.href] ?? child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // ── Flat item ───────────────────────────────────────────────────────
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isParentActive
                  ? "bg-primary text-white"
                  : "text-slate-400 hover:bg-primary/10 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {NAV_ITEM_LABELS[item.href] ?? item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── User info + sign out ────────────────────────────────────────────────── */}
      {session?.user && (
        <div className={`border-t border-primary/20 ${collapsed ? "px-2 py-3" : "px-4 py-4 space-y-3"}`}>
          {collapsed ? (
            /* Collapsed: avatar with tooltip */
            <div className="relative group flex justify-center">
              <Link href="/profile">
                <Avatar
                  name={session.user.name ?? "?"}
                  size="size-9"
                  textSize="text-xs"
                  className="border border-primary/30 cursor-pointer"
                />
              </Link>
              {/* Rich tooltip: name + role */}
              <div className="
                absolute left-full top-1/2 -translate-y-1/2 ml-3
                px-3 py-2 bg-slate-800 border border-primary/20
                rounded-lg whitespace-nowrap
                opacity-0 group-hover:opacity-100 pointer-events-none
                transition-opacity duration-150 z-50 shadow-lg
              ">
                <p className="text-xs font-semibold text-slate-200">{session.user.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{(session.user as any).role}</p>
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
              </div>
            </div>
          ) : (
            /* Expanded: full user info + sign out */
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2.5 rounded-lg px-1 py-1 -mx-1 hover:bg-primary/10 transition-colors group/profile"
              >
                <Avatar
                  name={session.user.name ?? "?"}
                  size="size-9"
                  textSize="text-xs"
                  className="border border-primary/30 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate group-hover/profile:text-primary transition-colors">
                    {session.user.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {(session.user as any).role}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                {t.nav.signOut}
              </button>
            </>
          )}
        </div>
      )}

    </aside>
  );
}
