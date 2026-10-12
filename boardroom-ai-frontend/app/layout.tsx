import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/ui/theme-provider";
import "./globals.css";
import { BoardSessionProvider } from "@/context/board-session-context";

export const metadata: Metadata = {
  title: {
    default: "Boardroom AI — Your AI Board of Directors",
    template: "%s · Boardroom AI",
  },
  description:
    "An enterprise AI platform where specialized AI executives collaborate, debate, vote, and generate strategic business decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans text-foreground">
        <ThemeProvider>
          <BoardSessionProvider>{children}</BoardSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
