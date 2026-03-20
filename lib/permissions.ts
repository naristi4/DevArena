import type { Role } from "@/lib/users";

// ─── Action Catalogue ─────────────────────────────────────────────────────────

export type Action =
  | "settings:access"     // access /settings/* routes
  | "users:manage"        // create / edit users
  | "squads:manage"       // create / edit / delete squads
  | "pipeline:create"     // add new pipeline items
  | "pipeline:edit"       // edit or move existing pipeline items
  | "tasks:edit_all"      // edit any field on any task (Admin)
  | "tasks:edit_assigned"; // change status + reassignee on own tasks (Squad Member)

// ─── Role → Permissions Map ───────────────────────────────────────────────────

const PERMISSIONS: Record<Role, readonly Action[]> = {
  "Admin": [
    "settings:access",
    "users:manage",
    "squads:manage",
    "pipeline:create",
    "pipeline:edit",
    "tasks:edit_all",
    "tasks:edit_assigned",
  ],
  "SquadMember": [
    "tasks:edit_assigned",
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if the given role has permission to perform the given action.
 * Safe to call from both server components and client components.
 */
export function can(role: Role, action: Action): boolean {
  return (PERMISSIONS[role] ?? []).includes(action);
}

/** Convenience shorthand. */
export function isAdmin(role: Role): boolean {
  return role === "Admin";
}
