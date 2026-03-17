import { redirect } from "next/navigation";

// Legacy route — redirect to the new Settings > Squads location
export default function SquadsPage() {
  redirect("/settings/squads");
}
