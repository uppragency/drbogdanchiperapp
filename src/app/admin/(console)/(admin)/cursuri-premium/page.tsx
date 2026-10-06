import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, LinkButton, PageTitle } from "@/components/ui";
import { COURSE_COLUMNS, formatLei, normalizeCourse, pricing } from "@/lib/courses";

export const metadata: Metadata = { title: "Cursuri premium" };

export default async function CoursesAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.from("premium_courses").select(COURSE_COLUMNS).order("position").order("created_at", { ascending: false });
  const courses = (data ?? []).map((r) => normalizeCourse(r as Record<string, unknown>));
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Cursuri premium">
        <LinkButton href="/admin/cursuri-premium/nou">Curs nou</LinkButton>
      </PageTitle>
      {courses.length === 0 && <p className="text-sm text-muted">Niciun curs încă.</p>}
      <div className="flex flex-col gap-3">
        {courses.map((c) => {
          const p = pricing(c);
          return (
            <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5">
              <div className="flex min-w-0 flex-col gap-1">
                <Link href={`/admin/cursuri-premium/${c.id}`} className="font-semibold hover:underline">{c.title}</Link>
                <p className="text-sm text-muted">Poziția {c.position}. Preț membru {formatLei(p.member)}, fără reducere {formatLei(p.list)}.</p>
              </div>
              <div className="flex items-center gap-2">
                {p.offerActive && <Badge tone="warn">Ofertă activă</Badge>}
                <Badge tone={c.is_published ? "ok" : "neutral"}>{c.is_published ? "Publicat" : "Ciornă"}</Badge>
                <LinkButton href={`/admin/cursuri-premium/${c.id}`} variant="secondary">Editează</LinkButton>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
