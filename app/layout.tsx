import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import HudBackground from "@/components/HudBackground";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ForgeAI — Adaptive Execution Plans",
  description: "Turn your idea into an execution plan that adapts on its own.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${mono.variable} ${sans.variable}`}>
      <body className="font-sans antialiased relative min-h-screen overflow-x-hidden">
        <HudBackground />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
