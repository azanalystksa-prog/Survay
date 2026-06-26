import type { Metadata } from "next";
import { Cairo, Tajawal, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { getLang } from "@/lib/session";

const cairo = Cairo({ subsets: ["latin", "arabic"], weight: ["400", "700", "800"], variable: "--font-cairo" });
const tajawal = Tajawal({ subsets: ["latin", "arabic"], weight: ["400", "500", "700"], variable: "--font-tajawal" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: "Easy Survey — Research operating system",
  description: "A verified-panel research platform for universities.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  const dir = lang === "ar" ? "rtl" : "ltr";
  return (
    <html lang={lang} dir={dir} className={`${cairo.variable} ${tajawal.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
