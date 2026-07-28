import type { Metadata } from "next";
import {
  Amiri,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Noto_Nastaliq_Urdu,
} from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCorpusTotal } from "@/lib/api/client";

import "./globals.css";

// Amiri — a revival of the Bulaq press naskh, cut for vocalized Arabic.
const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

// Noto Nastaliq Urdu — the calligraphic script Urdu translations are set in.
const nastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-nastaliq-urdu",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

// The corpus holds no English, so Latin is apparatus: a catalogue-card mono
// for labels, numbers and citations, and a plain sans for the little prose.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Hadees — the hadith corpus in Arabic and Urdu",
    template: "%s · Hadees",
  },
  description:
    "Read fifteen hadith collections in vocalized Arabic with the Dar-us-Salam Urdu translation. Browse by kitab and baab, or go straight to a citation.",
};

// Apply the saved theme before paint so the page never flashes the wrong mode.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const narrations = await getCorpusTotal();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${amiri.variable} ${nastaliq.variable} ${plexMono.variable} ${plexSans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter narrations={narrations} />
      </body>
    </html>
  );
}
