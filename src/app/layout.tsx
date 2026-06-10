import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { AuthNav } from "@/components/AuthNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Answerini — Free Live Quiz Platform",
  description:
    "Host live quiz games for up to 500 players. A free Kahoot alternative with rooms, real-time scoring, and leaderboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full antialiased">
        <header className="border-b border-white/10 bg-black/20 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-xl font-black tracking-tight">
              Answer<span className="text-yellow-300">ini</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm font-semibold">
              <Link href="/join" className="text-white/80 hover:text-white">
                Join
              </Link>
              <AuthNav />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
