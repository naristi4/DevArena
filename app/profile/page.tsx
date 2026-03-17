import { getServerSession } from "next-auth";
import { redirect }         from "next/navigation";
import { authOptions }      from "@/lib/auth";
import { MOCK_USERS }       from "@/lib/users";
import ProfileClient        from "@/components/ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = MOCK_USERS.find((u) => u.email === session.user.email);
  if (!user) redirect("/login");

  return (
    <ProfileClient
      email={user.email}
      initialName={user.name}
      role={user.role}
      squad={user.squad}
      avatarUrl={user.avatar_url ?? ""}
    />
  );
}
