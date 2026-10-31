import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";
import { MobileBottomNavigation } from "@/components/layout/MobileBottomNavigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Community Scam Map | India's Citizen Cyber Fraud Defense Grid",
    template: "%s | Community Scam Map",
  },
  description:
    "Real-time community-driven intelligence network to verify suspect phone numbers, UPI handles, bank accounts, and phishing links across India.",
  keywords: [
    "cyber fraud",
    "scam map",
    "UPI fraud",
    "India cybersecurity",
    "report scam",
    "verify phone number",
    "phishing check",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#080d1a] text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950">
        <AppHeader />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <AppFooter />
        <MobileBottomNavigation />
      </body>
    </html>
  );
}
