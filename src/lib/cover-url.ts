import { env } from "@/lib/env";

// Manual covers live in the public "covers" bucket.
export const coverUrl = (path: string) => `${env.supabaseUrl}/storage/v1/object/public/covers/${path}`;
