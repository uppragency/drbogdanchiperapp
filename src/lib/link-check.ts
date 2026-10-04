import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type CheckResult = { ok: boolean; status: string };

const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;

function privateAddress(ip: string): boolean {
  if (ip.includes(":")) {
    const l = ip.toLowerCase();
    if (l === "::1" || l === "::" || l.startsWith("fe80") || l.startsWith("fc") || l.startsWith("fd")) return true;
    const m = l.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return m ? privateAddress(m[1]) : false;
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

// SSRF guard: https only, no IP literals, no localhost/internal names, and the resolved addresses must be public.
export async function safeUrl(raw: string): Promise<URL | null> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  if (u.protocol !== "https:" || u.username || u.password) return null;
  if (u.port && u.port !== "443") return null;
  if (!host.includes(".") || host.startsWith("[") || isIP(host) || /^\d+$/.test(host.replace(/\./g, ""))) return null;
  if (host === "localhost" || /\.(localhost|local|internal|lan|home|corp)$/.test(host)) return null;
  try {
    const addrs = await lookup(host, { all: true });
    if (addrs.length === 0 || addrs.some((a) => privateAddress(a.address))) return null;
  } catch {
    return null;
  }
  return u;
}

async function timed(url: string, init: RequestInit): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctl.signal, redirect: "manual", headers: { "user-agent": "Mozilla/5.0 (compatible; MentorMedLinkCheck/1.0)", accept: "*/*" } });
  } finally {
    clearTimeout(timer);
  }
}

// Follows redirects by hand so every hop passes the SSRF guard again.
async function request(start: URL, method: "HEAD" | "GET"): Promise<Response | "blocked"> {
  let u = start;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await timed(u.toString(), { method });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      const next = await safeUrl(new URL(res.headers.get("location")!, u).toString());
      if (!next) return "blocked";
      u = next;
      continue;
    }
    res.body?.cancel().catch(() => {});
    return res;
  }
  return new Response(null, { status: 310 });
}

export async function checkUrl(raw: string): Promise<CheckResult> {
  const u = await safeUrl(raw);
  if (!u) return { ok: false, status: "link blocat sau invalid" };
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  try {
    let probe: URL | null = null;
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") probe = new URL(`https://www.youtube.com/oembed?url=${encodeURIComponent(u.toString())}&format=json`);
    else if (host === "vimeo.com" || host === "player.vimeo.com") probe = new URL(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(u.toString())}`);
    if (probe) {
      const r = await request(probe, "GET");
      if (r === "blocked") return { ok: false, status: "link blocat" };
      return { ok: r.status === 200, status: String(r.status) };
    }
    let r = await request(u, "HEAD");
    if (r !== "blocked" && (r.status === 405 || r.status === 403 || r.status === 501)) r = await request(u, "GET");
    if (r === "blocked") return { ok: false, status: "redirecționare blocată" };
    return { ok: r.status >= 200 && r.status < 400, status: String(r.status) };
  } catch (e) {
    return { ok: false, status: e instanceof Error && e.name === "AbortError" ? "timeout" : "nu răspunde" };
  }
}

export async function runPool<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) {
        const item = items[i++];
        await fn(item);
      }
    }),
  );
}
