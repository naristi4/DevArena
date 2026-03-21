"use server";

import { prisma }        from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect }       from "next/navigation";

/**
 * Soft-deletes a project then redirects to /pipeline.
 */
export async function deleteProject(id: string): Promise<void> {
  await prisma.project.update({
    where: { id },
    data:  { deleted: true },
  });
  revalidatePath("/pipeline");
  redirect("/pipeline");
}
