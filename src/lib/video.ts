// Only YouTube and Vimeo are embedded. Anything else is shown as a link.
export type VideoInfo = { provider: "youtube" | "vimeo"; id: string; hash?: string; url: string };

const YT_ID = /^[\w-]{6,20}$/;

export function parseVideo(raw: string | null | undefined): VideoInfo | null {
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return YT_ID.test(id) ? { provider: "youtube", id, url: raw } : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const id = u.pathname === "/watch" ? u.searchParams.get("v") : u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{6,20})/)?.[1];
    return id && YT_ID.test(id) ? { provider: "youtube", id, url: raw } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = u.pathname.match(/(?:\/video)?\/(\d{5,12})(?:\/([0-9a-f]{6,20}))?/);
    if (!m) return null;
    return { provider: "vimeo", id: m[1], hash: m[2] ?? u.searchParams.get("h") ?? undefined, url: raw };
  }
  return null;
}

export function embedUrl(v: VideoInfo, autoplay = false) {
  if (v.provider === "youtube") {
    const p = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
    if (autoplay) p.set("autoplay", "1");
    return `https://www.youtube-nocookie.com/embed/${v.id}?${p}`;
  }
  const p = new URLSearchParams({ dnt: "1" });
  if (v.hash) p.set("h", v.hash);
  if (autoplay) p.set("autoplay", "1");
  return `https://player.vimeo.com/video/${v.id}?${p}`;
}

// Candidate cover images, best first. YouTube covers are public. Vimeo needs an oEmbed lookup.
export async function videoCovers(raw: string | null | undefined): Promise<string[]> {
  const v = parseVideo(raw);
  if (!v) return [];
  if (v.provider === "youtube") {
    return [`https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`, `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`];
  }
  try {
    const target = `https://vimeo.com/${v.id}${v.hash ? `/${v.hash}` : ""}`;
    const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(target)}&width=960`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { thumbnail_url?: string };
    return json.thumbnail_url?.startsWith("https://") ? [json.thumbnail_url] : [];
  } catch {
    return [];
  }
}
