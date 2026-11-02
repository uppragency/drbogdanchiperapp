"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { runLinkBatch } from "@/lib/link-run";

export async function runLinkCheck() {
  await requireAdmin();
  const { checked, bad, remaining } = await runLinkBatch(await createClient());
  revalidatePath("/admin/linkuri");
  revalidatePath("/admin");
  redirect(`/admin/linkuri?rulat=${checked}&probleme=${bad}&ramase=${remaining}`);
}
