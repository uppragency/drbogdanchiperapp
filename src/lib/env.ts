export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  emailFrom: process.env.EMAIL_FROM ?? "MentorMed <platforma@drbogdanchiper.ro>",
};

export function serverSecret(name: "SUPABASE_SERVICE_ROLE_KEY" | "RESEND_API_KEY"): string {
  const value = process.env[name];
  if (!value) throw new Error(`Lipseste variabila de mediu ${name}`);
  return value;
}
