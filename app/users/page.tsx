import { redirect } from "next/navigation";

// Legacy route — redirect to the new Settings > Users location
export default function UsersPage() {
  redirect("/settings/users");
}
