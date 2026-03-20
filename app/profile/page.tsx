import { getServerSession } from "next-auth";
import { redirect }         from "next/navigation";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";
import ProfileClient        from "@/components/ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where:   { email: session.user.email! },
    include: { squad: true },
  });
  if (!user) redirect("/login");

  return (
    <ProfileClient
      userId={user.id}
      email={user.email}
      initialName={user.name}
      role={user.role}
      squad={user.squad?.name ?? ""}
      avatarUrl={user.avatarUrl ?? ""}
    />
  );
}
