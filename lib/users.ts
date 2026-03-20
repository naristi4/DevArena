// ─── Types ────────────────────────────────────────────────────────────────────
// MOCK_USERS removed — data now lives in PostgreSQL (Prisma).
// These types are still imported by components and next-auth type augmentations.

export type Role     = "Admin" | "SquadMember";
export type Position = "Developer" | "Architect" | "PM";

export interface User {
  id:        string;
  name:      string;
  email:     string;
  role:      Role;
  squad:     string;   // squad name
  position?: Position;
  avatarUrl?: string;
}
