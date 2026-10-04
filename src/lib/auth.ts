import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type Viewer = {
  id: string;
  email: string;
  role: "admin" | "user";
  firstName: string;
  lastName: string;
  termsAcceptedAt: string | null;
  sessionId: string | null;
};

type Resolved =
  | { status: "anonymous" }
  | { status: "revoked" }
  | { status: "inactive" }
  | { status: "ok"; viewer: Viewer };

function shortDevice(ua: string) {
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "Necunoscut";
  const br = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "Browser";
  return `${br} pe ${os}`;
}

// One resolution per request. Verifies the JWT, loads the profile and registers the session
// (enforcing the maximum of 2 active sessions per account).
const resolve = cache(async (): Promise<Resolved> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { status: "anonymous" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,role,first_name,last_name,is_active,deleted_at,access_expires_at,terms_accepted_at")
    .eq("id", claims.sub)
    .maybeSingle();

  if (!profile || !profile.is_active || profile.deleted_at) return { status: "inactive" };
  if (profile.role !== "admin" && profile.access_expires_at && new Date(profile.access_expires_at) < new Date()) {
    return { status: "inactive" };
  }

  const sessionId = typeof claims.session_id === "string" ? claims.session_id : null;
  if (sessionId) {
    const ua = (await headers()).get("user-agent") ?? "";
    const admin = createAdminClient();
    const { data: result } = await admin.rpc("register_session", {
      p_user: profile.id,
      p_session: sessionId,
      p_device: shortDevice(ua),
      p_max: 2,
    });
    if (result === "invalid") return { status: "revoked" };
  }

  return {
    status: "ok",
    viewer: {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      firstName: profile.first_name,
      lastName: profile.last_name,
      termsAcceptedAt: profile.terms_accepted_at,
      sessionId,
    },
  };
});

export async function getViewer(): Promise<Viewer | null> {
  const r = await resolve();
  return r.status === "ok" ? r.viewer : null;
}

export async function requireUser(opts: { allowUnacceptedTerms?: boolean } = {}): Promise<Viewer> {
  const r = await resolve();
  if (r.status === "anonymous") redirect("/login");
  if (r.status === "revoked") redirect("/auth/iesire?motiv=sesiune");
  if (r.status === "inactive") redirect("/auth/iesire?motiv=inactiv");
  if (!opts.allowUnacceptedTerms && !r.viewer.termsAcceptedAt) redirect("/termeni");
  return r.viewer;
}

// Admin role check. Two step verification is optional: an admin who enrolled a factor must pass the challenge, others are not forced to enrol.
export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireUser();
  if (viewer.role !== "admin") redirect("/feed");
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data?.nextLevel === "aal2" && data.currentLevel !== "aal2") redirect("/mfa");
  return viewer;
}

export function fullName(v: { firstName: string; lastName: string; email: string }) {
  const n = `${v.firstName} ${v.lastName}`.trim();
  return n || v.email;
}
