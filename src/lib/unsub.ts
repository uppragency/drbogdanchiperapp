import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

function secret() {
  const s = process.env.CRON_SECRET;
  if (!s) throw new Error("Lipseste variabila de mediu CRON_SECRET");
  return s;
}

export const unsubToken = (userId: string) => createHmac("sha256", secret()).update(`unsub:${userId}`).digest("hex");

export function validUnsubToken(userId: string, token: string) {
  const a = Buffer.from(unsubToken(userId));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const unsubUrl = (userId: string) => `${env.siteUrl}/dezabonare?u=${userId}&t=${unsubToken(userId)}`;
