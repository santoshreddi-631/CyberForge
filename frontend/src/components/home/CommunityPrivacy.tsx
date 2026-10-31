"use client";

import React from "react";
import { EyeOff, Layers, MapPinOff, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export function CommunityPrivacy() {
  const { lang } = useLanguage();
  const isHi = lang === "hi";

  const privacyPrinciples = [
    {
      title: isHi ? "शिकायतकर्ता की पहचान सुरक्षित" : "Protected Reporter Identity",
      description: isHi
        ? "शिकायत दर्ज करने वाले नागरिकों की पहचान कभी भी सार्वजनिक नहीं की जाती। हमारा ध्यान व्यक्तिगत प्रोफ़ाइल के बजाय केवल धोखाधड़ी के पैटर्न पर होता है।"
        : "Reporter identities should not be publicly displayed. Community contributions focus on fraud patterns rather than individual citizen profiles.",
      icon: EyeOff,
    },
    {
      title: isHi ? "क्षेत्र स्तर पर समूहीकरण" : "Area-Level Aggregation",
      description: isHi
        ? "मानचित्र पर प्रदर्शित जानकारी केवल इलाका और पिन कोड स्तर पर समूहीकृत की जाती है ताकि किसी व्यक्तिगत घर या परिवार का पता उजागर न हो।"
        : "Public map information should be aggregated by area to provide geographic threat awareness without pin-pointing individual households.",
      icon: Layers,
    },
    {
      title: isHi ? "सटीक स्थान का कोई प्रदर्शन नहीं" : "No Exact Location Exposure",
      description: isHi
        ? "शिकायतकर्ताओं का सटीक GPS स्थान या पता कभी सार्वजनिक नहीं किया जाता। निर्देशांक पड़ोस, जिले या शहर स्तर पर सुरक्षित रहते हैं।"
        : "Exact reporter locations should not be exposed. Coordinates are clustered to neighborhood, district, or PIN code level.",
      icon: MapPinOff,
    },
    {
      title: isHi ? "गोपनीयता-संवेदनशील प्रस्तुति" : "Privacy-Conscious Presentation",
      description: isHi
        ? "संदिग्ध पहचानकर्ताओं का प्रदर्शन ज़िम्मेदार डेटा नियमों का पालन करते हुए केवल साइबर अपराध की रोकथाम के उद्देश्य से किया जाता है।"
        : "Suspicious identifier information should be displayed in a privacy-conscious way, balancing fraud prevention with responsible data practices.",
      icon: ShieldAlert,
    },
  ];

  return (
    <section className="py-12 md:py-20 border-b border-slate-800/80 bg-slate-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-semibold text-teal-400 mb-3">
            <span>{isHi ? "ज़िम्मेदार नागरिक सुरक्षा" : "Responsible Intelligence"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {isHi ? "आपकी सुरक्षा। आपकी गोपनीयता।" : "Your Safety. Your Privacy."}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            {isHi
              ? "कम्युनिटी स्कैम मैप एक सख्त गोपनीयता-प्रथम मॉडल पर काम करता है। हमारा उद्देश्य नागरिकों की निजता की रक्षा करते हुए साइबर अपराधियों को रोकना है।"
              : "Community Scam Map operates on a privacy-conscious model. Our objective is to stop cyber criminals and alert citizens while strictly safeguarding the privacy of individuals who report incidents."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {privacyPrinciples.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex items-start gap-4 p-5 sm:p-6 rounded-xl bg-slate-900/60 border border-slate-800/90"
              >
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100 mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CommunityPrivacy;
