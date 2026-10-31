"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShieldCheck,
  ArrowRight,
  MapPin,
  AlertCircle,
  Activity,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useLanguage } from "@/hooks/useLanguage";
import { DonutRing, CircularOutline, DotGrid } from "@/components/ui/DecorativeShapes";

export function HeroSection() {
  const router = useRouter();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/lookup?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/lookup");
    }
  };

  const sampleQueries = [
    { label: "Phone", query: "+91 98765 43210" },
    { label: "UPI", query: "cashback-claim@upi" },
    { label: "URL", query: "https://secure-kyc-update.in" },
    { label: "Sender ID", query: "VK-SBIINB" },
  ];

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
      <section className="relative w-full overflow-hidden rounded-[2.5rem] lg:rounded-[3.5rem] bg-gradient-to-br from-[#6035E8] via-[#5421D6] to-[#4317BD] text-white shadow-[0_20px_60px_rgba(96,53,232,0.28)] pt-12 pb-16 lg:pt-16 lg:pb-20 px-6 sm:px-10 lg:px-16">
        {/* Decorative Shapes inside Hero */}
        <DonutRing
          color="yellow"
          size="xl"
          className="absolute -top-16 -right-16 z-0 opacity-95 hidden lg:block"
        />
        <DonutRing
          color="yellow"
          size="sm"
          className="absolute top-1/2 -left-8 z-0 opacity-80 hidden md:block"
        />
        <CircularOutline
          color="white"
          size="lg"
          className="absolute -bottom-20 -left-10 z-0 opacity-40"
        />
        <CircularOutline
          color="teal"
          size="md"
          className="absolute top-8 right-1/3 z-0 opacity-50 hidden sm:block"
        />
        <DotGrid
          color="white"
          rows={5}
          cols={6}
          className="absolute top-8 left-8 z-0 opacity-25 hidden sm:grid"
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center max-w-7xl mx-auto">
          {/* Left Column: Heading, Description, Prominent Search Bar, CTAs */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-left">
            {/* National Defense Pill Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-bold text-white tracking-wide uppercase shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-[#FFC928] animate-pulse" />
              <span>{t.home.badge}</span>
            </div>

            {/* Main Bold Headline (Preserving existing text & tagline) */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
              {t.home.headline1}{" "}
              <br className="hidden sm:inline" />
              <span className="text-[#FFC928] drop-shadow-sm">
                {t.home.headline2}
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-purple-100/90 max-w-xl leading-relaxed font-normal">
              {t.home.subtitle}
            </p>

            {/* PROMINENT SEARCH BAR (Core Requirement) */}
            <div className="pt-2 max-w-2xl">
              <form
                onSubmit={handleSearchSubmit}
                role="search"
                aria-label="Check suspicious identifier"
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-2 sm:p-2.5 rounded-2xl sm:rounded-full bg-white shadow-[0_16px_40px_rgba(23,22,56,0.22)] border-2 border-white/90 focus-within:ring-4 focus-within:ring-[#08C9C5]/40 transition-all duration-200"
              >
                <div className="relative flex-1 flex items-center min-w-0">
                  <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-[#6035E8]">
                    <Search className="w-5 h-5 shrink-0" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter phone number, UPI ID, URL or SMS sender ID"
                    aria-label="Enter phone number, UPI ID, URL or SMS sender ID"
                    className="w-full h-11 bg-transparent text-[#171638] placeholder:text-slate-400 text-sm sm:text-base font-semibold outline-none pr-3"
                  />
                </div>

                <button
                  type="submit"
                  className="h-12 px-7 rounded-xl sm:rounded-full bg-[#08C9C5] hover:bg-[#06B5B1] active:bg-[#059E9A] text-[#171638] font-black text-sm sm:text-base shadow-md transition-all duration-150 flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer"
                >
                  <span>{t.home.checkButton}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </form>

              {/* Quick Example Chips */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-purple-200 font-bold mr-1">
                  {t.home.quickChecks}:
                </span>
                {sampleQueries.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSearchQuery(item.query)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/35 border border-white/20 text-white font-medium transition-colors cursor-pointer"
                  >
                    <span className="text-[10px] text-purple-200 uppercase tracking-wider font-bold">
                      {item.label}:
                    </span>
                    <span className="font-mono text-[11px] font-semibold">
                      {item.query}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Navigation Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <Link href="/report" className="w-full sm:w-auto">
                <PrimaryButton
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto text-[#6035E8] border-none shadow-lg shadow-black/10 font-black"
                  leftIcon={<AlertCircle className="w-4 h-4" />}
                >
                  {t.home.reportIncident}
                </PrimaryButton>
              </Link>
              <Link href="/map" className="w-full sm:w-auto">
                <PrimaryButton
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                  leftIcon={<MapPin className="w-4 h-4" />}
                >
                  {t.home.exploreMap}
                </PrimaryButton>
              </Link>
            </div>
          </div>

          {/* Right Column: Cybersecurity Hero Composition (Inspired by Agency Reference) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Decorative background donut behind card composition */}
            <div className="w-full max-w-md relative">
              <div className="relative rounded-[2.5rem] bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-xl border border-white/25 p-6 sm:p-8 shadow-2xl space-y-5">
                {/* Visual Top Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-white/15">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-[#08C9C5] animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-100">
                      Live Defense Radar
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFC928] text-[#171638] text-[10px] font-black uppercase">
                    Active
                  </span>
                </div>

                {/* Central Security Shield & Radar Graphic */}
                <div className="relative py-4 flex flex-col items-center justify-center">
                  {/* Concentric glowing radar rings */}
                  <div className="w-32 h-32 rounded-full border border-white/20 flex items-center justify-center relative">
                    <div className="w-24 h-24 rounded-full border border-white/30 flex items-center justify-center relative">
                      <div className="w-16 h-16 rounded-full bg-[#08C9C5]/20 border border-[#08C9C5] flex items-center justify-center shadow-lg shadow-[#08C9C5]/30">
                        <ShieldCheck className="w-8 h-8 text-[#08C9C5]" />
                      </div>
                    </div>
                  </div>

                  <p className="text-center font-black text-lg text-white mt-4">
                    25 Urban Hotspot Centroids
                  </p>
                  <p className="text-center text-xs text-purple-200 mt-0.5">
                    Continuous rolling 7-day pattern evaluation
                  </p>
                </div>

                {/* Overlapping Floating Status Badges */}
                <div className="space-y-3 pt-1">
                  {/* Floating Metric 1 */}
                  <div className="p-3.5 rounded-2xl bg-white text-[#171638] shadow-lg flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6035E8] flex items-center justify-center shrink-0">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black">Trust Engine Active</div>
                        <div className="text-[11px] text-[#6E6D8F]">HMAC Privacy Protection</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      99.8%
                    </span>
                  </div>

                  {/* Floating Metric 2 */}
                  <div className="p-3.5 rounded-2xl bg-white text-[#171638] shadow-lg flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black">Official Helplines</div>
                        <div className="text-[11px] text-[#6E6D8F]">1930 & Banking Reg. Verified</div>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HeroSection;
