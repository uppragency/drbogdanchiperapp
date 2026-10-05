import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Everything the platform stores about the signed in member, as a JSON download (GDPR access).
export async function GET() {
  const viewer = await requireUser();
  const supabase = await createClient();
  const [profile, tags, favorites, views, comments, notes, goal, days, follows] = await Promise.all([
    supabase.from("profiles").select("email,first_name,last_name,specialty,city,created_at,access_expires_at,last_login_at").eq("id", viewer.id).maybeSingle(),
    supabase.from("user_tags").select("created_at,tags(name)").eq("user_id", viewer.id),
    supabase.from("favorites").select("created_at,resources(title)").eq("user_id", viewer.id),
    supabase.from("resource_views").select("first_viewed_at,last_viewed_at,completed,view_count,resources(title)").eq("user_id", viewer.id),
    supabase.from("comments").select("created_at,body,resources(title)").eq("user_id", viewer.id),
    supabase.from("resource_notes").select("updated_at,body,resources(title)").eq("user_id", viewer.id),
    supabase.from("user_goals").select("weekly_goal").eq("user_id", viewer.id).maybeSingle(),
    supabase.from("activity_days").select("day").eq("user_id", viewer.id).order("day"),
    supabase.from("category_subscriptions").select("categories(name)").eq("user_id", viewer.id),
  ]);
  const body = {
    exportedAt: new Date().toISOString(),
    profile: profile.data,
    groups: tags.data ?? [],
    favorites: favorites.data ?? [],
    resourceViews: views.data ?? [],
    comments: comments.data ?? [],
    notes: notes.data ?? [],
    weeklyGoal: goal.data?.weekly_goal ?? null,
    activeDays: (days.data ?? []).map((d: { day: string }) => d.day),
    followedCategories: follows.data ?? [],
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="datele-mele-mentormed.json"',
      "Cache-Control": "no-store",
    },
  });
}
