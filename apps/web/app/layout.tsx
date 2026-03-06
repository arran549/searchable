import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";

import { assertProductionEnv } from "@/lib/env";

import "./globals.css";

assertProductionEnv();

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Searchable Take-Home",
  description: "Starter workspace for the Searchable AI crawler analytics take-home.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${mono.variable}`}>
      <head>
        <script async src="http://127.0.0.1:54321/functions/v1/track/track.js?token=beae8bcfbdd8d9dd612445fec9c636da0ed9&spa=1&v=7"></script>
      </head>
      <body className="font-[family-name:var(--font-sans)] antialiased">{children}</body>
    </html>
  );
}
