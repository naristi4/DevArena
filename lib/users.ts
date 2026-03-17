export type Role     = "Admin" | "Squad Member";
export type Position = "Developer" | "Architect" | "PM";

export interface User {
  id:         string;
  name:       string;
  email:      string;
  role:       Role;
  squad:      string;
  password:   string;    // plain text — mock only, replace with hashed in production
  position?:  Position;
  avatar_url?: string;   // profile photo URL; undefined/empty → show initials fallback
}

/** Mutate the in-memory user record so avatar changes propagate to all client components. */
export function updateUserAvatarUrl(name: string, url: string) {
  const user = MOCK_USERS.find((u) => u.name === name);
  if (user) user.avatar_url = url;
}

/** Update display name for a user (identified by email). */
export function updateUserName(email: string, newName: string): boolean {
  const user = MOCK_USERS.find((u) => u.email === email);
  if (!user) return false;
  user.name = newName;
  return true;
}

/** Verify current password then set new password. Returns false if verification fails. */
export function updateUserPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): boolean {
  const user = MOCK_USERS.find((u) => u.email === email);
  if (!user || user.password !== currentPassword) return false;
  user.password = newPassword;
  return true;
}

export const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@squadtracker.io",
    role: "Admin",
    squad: "Platform Squad",
    password: "demo1234",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@squadtracker.io",
    role: "Squad Member",
    squad: "Platform Squad",
    password: "demo1234",
  },
  {
    id: "3",
    name: "Carol White",
    email: "carol@squadtracker.io",
    role: "Squad Member",
    squad: "Growth Squad",
    password: "demo1234",
  },
  {
    id: "4",
    name: "Dan Torres",
    email: "dan@squadtracker.io",
    role: "Admin",
    squad: "Core Squad",
    password: "demo1234",
  },
  {
    id: "5",
    name: "Eva Chen",
    email: "eva@squadtracker.io",
    role: "Squad Member",
    squad: "Core Squad",
    password: "demo1234",
  },
];
