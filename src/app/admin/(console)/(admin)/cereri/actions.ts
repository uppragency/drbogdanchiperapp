"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMember } from "@/lib/users";

const uuid = z.string().uuid();

export async function approveRequest(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const tagId = uuid.safeParse(formData.get("tagId"));
  if (!tagId.success) redirect("/admin/cereri?err=grup");
  const admin = createAdminClient();
  const { data: req } = await admin.from("access_requests").select("*").eq("id", id).eq("status", "pending").maybeSingle();
  if (!req) redirect("/admin/cereri");
  const res = await createMember(admin, { email: req.email, firstName: req.first_name, lastName: req.last_name, tagIds: [tagId.data] });
  if (!res.id) redirect(`/admin/cereri?err=${encodeURIComponent(res.error ?? "Eroare")}`);
  await admin.from("access_requests").update({ status: "approved", handled_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/cereri");
  redirect(`/admin/useri/${res.id}`);
}

export async function rejectRequest(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const admin = createAdminClient();
  await admin.from("access_requests").update({ status: "rejected", handled_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/cereri");
}
