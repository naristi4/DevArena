import { getServerSession } from "next-auth";
import { redirect }         from "next/navigation";
import { authOptions }      from "@/lib/auth";

// /settings → redirect Admins to the first sub-section; non-Admins to home
export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "Admin") redirect("/");
  redirect("/settings/users");
}
