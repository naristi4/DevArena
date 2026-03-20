import { Suspense } from "react";
import DashboardClient from "@/components/DashboardClient";

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardClient />
    </Suspense>
  );
}
