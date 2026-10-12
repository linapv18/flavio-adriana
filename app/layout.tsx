import { weddingConfig as w, coupleNames, weddingTheme } from "@/config/weddingConfig";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Instrument_Serif, Jost } from "next/font/google";
import "./globals.css";
import PageMotion from "@/components/PageMotion";
import { siteUrl } from "@/lib/site-url.mjs";
import WeddingMusic from "@/components/WeddingMusic";


const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const sans = Jost({ variable: "--font-sans", subsets: ["latin"], weight: ["300", "400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl(w.site.url)),
  title: coupleNames,
  description: w.site.description,
  openGraph: { type: "website", locale: w.site.locale.replace("-", "_"), title: coupleNames, description: w.site.description, images: [{ url: w.assets.social, alt: coupleNames }] },
  twitter: { card: "summary_large_image", title: coupleNames, description: w.site.description, images: [w.assets.social] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={w.site.language} style={weddingTheme as CSSProperties}>
      <body
        className={`${serif.variable} ${sans.variable}`}
      >
        <WeddingMusic><PageMotion />{children}</WeddingMusic>
      </body>
    </html>
  );
}
