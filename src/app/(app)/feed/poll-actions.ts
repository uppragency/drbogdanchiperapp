"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Records the member's vote (one per poll, enforced by the database) and refreshes the home page.
export async function votePoll(formData: FormData): Promise<void> {
  await requireUser();
  const parsed = z.object({ poll: z.string().uuid(), option: z.string().uuid() }).safeParse({ poll: formData.get("poll"), option: formData.get("option") });
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase.rpc("cast_vote", { p_poll: parsed.data.poll, p_option: parsed.data.option });
  revalidatePath("/feed");
}
