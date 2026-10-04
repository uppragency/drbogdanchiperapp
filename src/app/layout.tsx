import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { t } from "@/lib/texts";
import { SiteFooter } from "@/components/site-footer";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: t.platformName, template: `%s | ${t.brand}` },
  description: "Platforma de curs pentru medicii înscriși în programul MentorMed.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "MentorMed", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#080c24" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${montserrat.variable} h-full`}>
      <body className="min-h-dvh flex flex-col">
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
