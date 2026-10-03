import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, PageTitle } from "@/components/ui";
import { UserForm } from "../user-form";
import { createUser } from "../actions";

export const metadata: Metadata = { title: "User nou" };

export default async function NewUser() {
  const supabase = await createClient();
  const { data: tags } = await supabase.from("tags").select("id,name").order("position");
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="User nou" />
      <Card><UserForm tags={tags ?? []} action={createUser} values={{ email: "", firstName: "", lastName: "", tagIds: [], accessExpires: "", paidAt: "", paidNote: "", adminNote: "", isActive: true }} /></Card>
    </div>
  );
}
