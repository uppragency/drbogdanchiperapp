import "server-only";
import { createHash } from "node:crypto";

export const MIN_PASSWORD_LENGTH = 10;

// Checks the Have I Been Pwned range API (k-anonymity: only a 5 character hash prefix leaves the server).
// Fails open on network errors so a third-party outage never blocks a legitimate password change.
export async function isPasswordCompromised(password: string): Promise<boolean> {
  try {
    const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!res.ok) return false;
    const body = await res.text();
    return body.split("\n").some((line) => {
      const [hash, count] = line.trim().split(":");
      return hash === suffix && Number(count) > 0;
    });
  } catch {
    return false;
  }
}
