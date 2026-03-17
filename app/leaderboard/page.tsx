import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import GamificationDashboard from "@/components/GamificationDashboard";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <GamificationDashboard />
    </div>
  );
}
