import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MentorMed",
    short_name: "MentorMed",
    description: "Platforma privată pentru medicii înscriși în programul MentorMed.",
    start_url: "/feed",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0d1c5c",
    lang: "ro",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
