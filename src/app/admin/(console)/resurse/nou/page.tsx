import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, PageTitle } from "@/components/ui";
import { ResourceForm } from "../resource-form";

export const metadata: Metadata = { title: "Resursă nouă" };

export default async function NewResource() {
  const supabase = await createClient();
  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabase.from("categories").select("id,name").order("position"),
    supabase.from("tags").select("id,name").order("position"),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Resursă nouă" />
      <Card>
        <ResourceForm
          categories={categories ?? []}
          tags={tags ?? []}
          values={{ title: "", description: "", type: "video", categoryId: "", body: "", videoUrl: "", status: "draft", publishAt: "", eventAt: "", isPinned: false, commentsEnabled: true, downloadEnabled: false, presenter: "", titleEn: "", descriptionEn: "", bodyEn: "", tagIds: [] }}
        />
      </Card>
    </div>
  );
}
