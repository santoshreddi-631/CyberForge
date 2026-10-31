import { Metadata } from "next";
import {
  HeroSection,
  QuickActions,
  HowItWorks,
  CommunityPrivacy,
  SafetyTips,
  EmergencySection,
} from "@/components/home";

export const metadata: Metadata = {
  title: "Community Scam Map | India's Citizen Cyber Fraud Defense Grid",
  description:
    "Check suspicious phone numbers, UPI IDs, and links. Report scams and help protect your community through shared awareness across India.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* 1. Hero Section with Prominent Search Interface & CTAs */}
      <HeroSection />

      {/* 2. Quick Action Cards (Lookup, Report, Map, Alerts) */}
      <QuickActions />

      {/* 3. Three-Step How It Works Workflow (Check, Report, Protect) */}
      <HowItWorks />

      {/* 4. Privacy-First Approach (Identity protection, Area aggregation) */}
      <CommunityPrivacy />

      {/* 5. Essential Online Safety Tips for Indian Citizens */}
      <SafetyTips />

      {/* 6. Official Indian Cyber Crime Helpline (1930) & Portal Links */}
      <EmergencySection />
    </div>
  );
}
