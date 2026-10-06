import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { Alert, Card, PageTitle, btn } from "@/components/ui";
import { COURSE_COLUMNS, normalizeCourse } from "@/lib/courses";
import { CourseForm } from "../course-form";
import { CourseCoverUpload } from "../cover-upload";
import { deleteCourse } from "../actions";

export const metadata: Metadata = { title: "Curs premium" };

export default async function EditCourse({ params, searchParams }: PageProps<"/admin/cursuri-premium/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  let course = null;
  if (id !== "nou") {
    if (!z.string().uuid().safeParse(id).success) notFound();
    const supabase = await createClient();
    const { data } = await supabase.from("premium_courses").select(COURSE_COLUMNS).eq("id", id).maybeSingle();
    if (!data) notFound();
    course = normalizeCourse(data as Record<string, unknown>);
  }
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/admin/cursuri-premium" className="text-sm font-semibold text-muted hover:text-ink">Înapoi la cursuri</Link>
      <PageTitle title={course ? course.title : "Curs nou"} />
      {sp.creat && <Alert kind="ok">Curs creat. Poți încărca acum imaginea.</Alert>}
      {course ? (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Imagine proprie</h2>
          <CourseCoverUpload courseId={course.id} current={course.cover_path} />
        </Card>
      ) : (
        <p className="text-sm text-muted">Imaginea se încarcă după prima salvare.</p>
      )}
      <CourseForm course={course} />
      {course && (
        <form action={deleteCourse}>
          <input type="hidden" name="id" value={course.id} />
          <button className={btn.danger}>Șterge cursul</button>
        </form>
      )}
    </div>
  );
}
