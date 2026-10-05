import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { LocaleProvider } from "@/components/locale-provider";
import { getLocale, getT, getTx } from "@/lib/i18n";
import { env } from "@/lib/env";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const tx = await getTx();
  return {
  metadataBase: new URL(env.siteUrl),
  title: { default: t.platformName, template: `%s | ${t.brand}` },
  openGraph: { siteName: t.brand, type: "website", locale: tx("ro_RO", "en_GB") },
  description: tx("Platforma de curs pentru medicii înscriși în programul MentorMed.", "The course platform for doctors enrolled in the MentorMed program."),
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "MentorMed", statusBarStyle: "default" },
  };
}

// Runs before first paint so the chosen theme never flashes.
const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem('theme');var d=s==='dark'||(s!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(e){var v=localStorage.getItem('theme');if(v!=='light'&&v!=='dark')document.documentElement.setAttribute('data-theme',e.matches?'dark':'light')})}catch(e){document.documentElement.setAttribute('data-theme','light')}})()`;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#080c24" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${montserrat.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh flex flex-col">
        <LocaleProvider locale={locale}>
          {children}
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
