import { getServerSession } from "next-auth";
import { redirect }        from "next/navigation";
import { authOptions }     from "@/lib/auth";
import { PIPELINE_STAGE_CONFIG } from "@/lib/pipeline";
import PipelineConfigClient      from "@/components/PipelineConfigClient";

export default async function SettingsPipelinePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "Admin") redirect("/");

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Pipeline Configuration</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage pipeline stage labels and their role in project tracking.
        </p>
      </div>
      <PipelineConfigClient initialStages={PIPELINE_STAGE_CONFIG} />
    </div>
  );
}
