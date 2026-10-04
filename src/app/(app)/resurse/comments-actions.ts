"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fullName, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { allow } from "@/lib/throttle";
import type { FormState } from "@/app/login/actions";
import { getTx } from "@/lib/i18n";

export async function addComment(_: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireUser();
  const tx = await getTx();
  const schema = z.object({
    resourceId: z.string().uuid(),
    parentId: z.string().uuid().nullable(),
    body: z.string().trim().min(2, tx("Scrie cel puțin două caractere.", "Write at least two characters.")).max(2000, tx("Comentariul poate avea maximum 2000 de caractere.", "A comment can have at most 2000 characters.")),
  });
  const parent = String(formData.get("parentId") ?? "");
  const p = schema.safeParse({ resourceId: formData.get("resourceId"), parentId: parent || null, body: formData.get("body") });
  if (!p.success) return { error: p.error.issues[0]?.message ?? tx("Date invalide.", "Invalid data.") };
  if (!(await allow(`comment:${viewer.id}`, 12, 3600))) return { error: tx("Ai trimis prea multe comentarii. Încearcă din nou peste puțin timp.", "You have posted too many comments. Try again in a little while.") };

  const supabase = await createClient();
  const { data: res } = await supabase.from("resources").select("title,comments_enabled").eq("id", p.data.resourceId).maybeSingle();
  if (!res) return { error: tx("Resursa nu mai există.", "This resource no longer exists.") };
  if (!res.comments_enabled && viewer.role !== "admin") return { error: tx("Comentariile sunt dezactivate pentru această resursă.", "Comments are disabled for this resource.") };
  let parentId = p.data.parentId;
  let notifyUser: string | null = null;
  if (parentId) {
    // Replies are one level deep: a reply to a reply attaches to the top comment.
    const { data: par } = await supabase.from("comments").select("id,parent_id,resource_id,user_id").eq("id", parentId).maybeSingle();
    if (!par || par.resource_id !== p.data.resourceId) return { error: tx("Comentariul nu mai există.", "This comment no longer exists.") };
    parentId = par.parent_id ?? par.id;
    notifyUser = par.user_id;
  }
  const { error } = await supabase.from("comments").insert({
    resource_id: p.data.resourceId,
    user_id: viewer.id,
    parent_id: parentId,
    author_name: viewer.role === "admin" ? `${fullName(viewer)} ${tx("(echipa)", "(team)")}` : fullName(viewer),
    body: p.data.body,
  });
  if (error) return { error: tx("Nu am putut trimite comentariul.", "We could not post your comment.") };
  if (notifyUser && notifyUser !== viewer.id) {
    // Written with the service role: members cannot insert notifications for others.
    await createAdminClient().from("notifications").insert({
      user_id: notifyUser,
      kind: "reply",
      resource_id: p.data.resourceId,
      message: `${fullName(viewer)} ți-a răspuns la comentariu la „${String(res.title).slice(0, 80)}”.`,
    });
  }
  revalidatePath(`/resurse/${p.data.resourceId}`);
  return { ok: tx("Comentariul a fost publicat.", "Your comment was posted.") };
}

export async function deleteComment(formData: FormData) {
  await requireUser();
  const id = z.string().uuid().safeParse(formData.get("id"));
  const resourceId = z.string().uuid().safeParse(formData.get("resourceId"));
  if (!id.success || !resourceId.success) return;
  const supabase = await createClient();
  await supabase.from("comments").delete().eq("id", id.data);
  revalidatePath(`/resurse/${resourceId.data}`);
}
