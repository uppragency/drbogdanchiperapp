import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Active members with no login in the last 30 days (or never), as CSV for Excel.
const cell = (v: string | null | undefined) => {
  let s = (v ?? "").replace(/\r?\n/g, " ");
  if (/^[=+\-@\t]/.test(s)) s = `'${s}`; // spreadsheet formula guard
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  await requireAdmin();
  const supabase = await createClient();
  const d30 = new Date(new Date().getTime() - 30 * 86400000).toISOString();
  const { data } = await supabase
    .from("profiles")
    .select("email,first_name,last_name,last_login_at,access_expires_at,created_at")
    .eq("role", "user")
    .eq("is_active", true)
    .is("deleted_at", null)
    .or(`last_login_at.is.null,last_login_at.lt.${d30}`)
    .order("last_login_at", { ascending: true, nullsFirst: true })
    .limit(5000);
  const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
  const lines = [
    ["Email", "Prenume", "Nume", "Ultima autentificare", "Acces până la", "Cont creat"].map(cell).join(","),
    ...(data ?? []).map((r) => [r.email, r.first_name, r.last_name, day(r.last_login_at) || "niciodată", day(r.access_expires_at), day(r.created_at)].map(cell).join(",")),
  ];
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="membri-inactivi-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
