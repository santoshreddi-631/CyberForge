"use client";

import React from "react";
import { EyeOff, Layers, MapPinOff, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { DonutRing, CircularOutline, DotGrid } from "@/components/ui/DecorativeShapes";

export function CommunityPrivacy() {
  const { lang } = useLanguage();
  const isHi = lang === "hi";

  const privacyPrinciples = [
    {
      title: isHi ? "शिकायतकर्ता की पहचान सुरक्षित" : "Protected Reporter Identity",
      description: isHi
        ? "शिकायत दर्ज करने वाले नागरिकों की पहचान कभी भी सार्वजनिक नहीं की जाती। हमारा ध्यान व्यक्तिगत प्रोफ़ाइल के बजाय केवल धोखाधड़ी के पैटर्न पर होता है।"
        : "Reporter identities are not publicly displayed. Keyed HMAC hashing safeguards reporter signals, focusing entirely on scam patterns.",
      icon: EyeOff,
    },
    {
      title: isHi ? "क्षेत्र स्तर पर समूहीकरण" : "Area-Level Aggregation",
      description: isHi
        ? "मानचित्र पर प्रदर्शित जानकारी केवल इलाका और पिन कोड स्तर पर समूहीकृत की जाती है ताकि किसी व्यक्तिगत घर या परिवार का पता उजागर न हो।"
        : "Public map information is aggregated by postal area and PRD centroids to provide geographic threat awareness without pin-pointing individual households.",
      icon: Layers,
    },
    {
      title: isHi ? "सटीक स्थान का कोई प्रदर्शन नहीं" : "No Exact Location Exposure",
      description: isHi
        ? "शिकायतकर्ताओं का सटीक GPS स्थान या पता कभी सार्वजनिक नहीं किया जाता। निर्देशांक पड़ोस, जिले या शहर स्तर पर सुरक्षित रहते हैं।"
        : "Exact reporter locations are never stored or exposed. Centroid coordinates represent postal areas, never citizen residential addresses.",
      icon: MapPinOff,
    },
    {
      title: isHi ? "गोपनीयता-संवेदनशील प्रस्तुति" : "Privacy-Conscious Presentation",
      description: isHi
        ? "संदिग्ध पहचानकर्ताओं का प्रदर्शन ज़िम्मेदार डेटा नियमों का पालन करते हुए केवल साइबर अपराध की रोकथाम के उद्देश्य से किया जाता है।"
        : "Identifiers are masked (e.g. 98XXXXX210, r***@okaxis) until corroborated by ≥3 distinct reporters, preventing premature disclosure.",
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 py-6">
      <section className="relative w-full overflow-hidden rounded-[2.5rem] lg:rounded-[3.5rem] bg-gradient-to-br from-[#6035E8] via-[#5421D6] to-[#3B1599] text-white p-8 sm:p-12 lg:p-16 shadow-[0_20px_60px_rgba(96,53,232,0.25)]">
        {/* Decorative Shapes */}
        <DonutRing
          color="yellow"
          size="lg"
          className="absolute -top-16 -right-16 opacity-80 pointer-events-none hidden sm:block"
        />
        <CircularOutline
          color="teal"
          size="lg"
          className="absolute -bottom-20 -left-16 opacity-40 pointer-events-none"
        />
        <DotGrid
          color="white"
          rows={5}
          cols={5}
          className="absolute top-10 left-10 opacity-20 pointer-events-none hidden md:grid"
        />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="max-w-3xl mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-black text-white uppercase tracking-wider mb-4">
              <span className="w-2 h-2 rounded-full bg-[#FFC928]" />
              <span>{isHi ? "ज़िम्मेदार नागरिक सुरक्षा" : "Privacy-First Architecture"}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {isHi ? "आपकी सुरक्षा। आपकी गोपनीयता।" : "Your Safety. Your Privacy."}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-purple-100/90 leading-relaxed font-normal">
              {isHi
                ? "कम्युनिटी स्कैम मैप एक सख्त गोपनीयता-प्रथम मॉडल पर काम करता है। हमारा उद्देश्य नागरिकों की निजता की रक्षा करते हुए साइबर अपराधियों को रोकना है।"
                : " operates on a strict privacy-first model. Our objective is to stop cyber criminals and alert citizens while strictly safeguarding the privacy of individuals who report incidents."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {privacyPrinciples.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="flex items-start gap-5 p-7 rounded-[2rem] bg-white text-[#171638] shadow-xl border border-white/20 hover:-translate-y-1 transition-transform duration-150"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#F0EDFF] text-[#6035E8] flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#171638] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#6E6D8F] leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default CommunityPrivacy;
