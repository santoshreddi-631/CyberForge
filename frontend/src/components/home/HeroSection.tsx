"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShieldAlert, ArrowRight, MapPin, AlertCircle } from "lucide-react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export function HeroSection() {
  const router = useRouter();
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
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24 border-b border-slate-800/80">
      {/* Subtle radial ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-teal-500/5 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -top-24 right-10 w-72 h-72 bg-blue-600/5 blur-3xl pointer-events-none rounded-full" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        {/* National Defense Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-medium text-slate-300 mb-6 shadow-sm">
          <ShieldAlert className="w-3.5 h-3.5 text-teal-400" />
          <span>India Citizen Cyber Fraud Intelligence Network</span>
          <span className="flex h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15] max-w-4xl mx-auto">
          Stay Ahead of Scams. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-200 to-sky-400">
            Protect Your Community.
          </span>
        </h1>

        {/* Supporting text */}
        <p className="mt-5 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Check suspicious numbers, UPI IDs and links. Report scams and help protect your
          community through shared awareness.
        </p>

        {/* Search Interface */}
        <div className="mt-8 sm:mt-10 max-w-2xl mx-auto">
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            aria-label="Check suspicious identifier"
            className="flex flex-col sm:flex-row items-stretch gap-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-700/90 shadow-xl shadow-slate-950/40 backdrop-blur-md focus-within:border-teal-500/80 focus-within:ring-1 focus-within:ring-teal-500/40 transition-all"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter phone number, UPI ID, URL or SMS sender ID"
                aria-label="Enter phone number, UPI ID, URL or SMS sender ID"
                className="w-full h-12 pl-11 pr-4 bg-transparent text-slate-100 placeholder:text-slate-400 text-sm sm:text-base outline-none"
              />
            </div>
            <PrimaryButton
              type="submit"
              variant="primary"
              size="lg"
              className="h-12 px-6 shrink-0 font-semibold"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Check Now
            </PrimaryButton>
          </form>

          {/* Quick Example Chips */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-400">
            <span className="mr-1 text-slate-400 font-medium">Quick checks:</span>
            {sampleQueries.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSearchQuery(item.query)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900/70 border border-slate-800 hover:border-slate-700 hover:text-teal-300 transition-colors"
              >
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{item.label}:</span>
                <span className="font-mono text-[11px]">{item.query}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link href="/report" className="w-full sm:w-auto">
            <PrimaryButton
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
              leftIcon={<AlertCircle className="w-4 h-4" />}
            >
              Report a Scam
            </PrimaryButton>
          </Link>
          <Link href="/map" className="w-full sm:w-auto">
            <PrimaryButton
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              leftIcon={<MapPin className="w-4 h-4" />}
            >
              Explore Scam Map
            </PrimaryButton>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
