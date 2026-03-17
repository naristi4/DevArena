"use server";

import { deleteProjectById } from "@/lib/pipeline";
import { revalidatePath }    from "next/cache";
import { redirect }          from "next/navigation";

/**
 * Soft-deletes a project and all its pages, then redirects to /pipeline.
 * Data resets on server restart (mock only — no real DB).
 */
export async function deleteProject(id: string): Promise<void> {
  deleteProjectById(id);
  revalidatePath("/pipeline");
  redirect("/pipeline");
}
