import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "@/components/AuthSessionProvider";

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

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("forgeai_theme");
    var dark = stored ? stored === "dark" : true;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${mono.variable} ${sans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased relative min-h-screen overflow-x-hidden">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
