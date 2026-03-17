import { getServerSession } from "next-auth";
import { redirect }        from "next/navigation";
import { authOptions }     from "@/lib/auth";
import { SCORING, SQUAD_BUG_COUNTS } from "@/lib/gamification";
import GamificationConfigClient      from "@/components/GamificationConfigClient";

export default async function SettingsGamificationPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "Admin") redirect("/");

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Gamification Rules</h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure the scoring rules that power the developer leaderboard.
        </p>
      </div>
      <GamificationConfigClient
        initialScoring={SCORING}
        initialBugCounts={SQUAD_BUG_COUNTS}
      />
    </div>
  );
}
