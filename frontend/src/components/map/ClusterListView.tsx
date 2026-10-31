"use client";

import React, { useState } from "react";
import {
  MapPin,
  ChevronRight,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { MapClusterItem } from "@/lib/contracts";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getScamTypeLabel } from "./ClusterDetailCard";

interface ClusterListViewProps {
  clusters: MapClusterItem[];
  selectedCluster: MapClusterItem | null;
  onSelectCluster: (cluster: MapClusterItem) => void;
  className?: string;
}

type SortField = "count" | "pincode" | "locality" | "severity";

export function ClusterListView({
  clusters,
  selectedCluster,
  onSelectCluster,
  className = "",
}: ClusterListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("count");
  const [sortAsc, setSortAsc] = useState(false);

  // Filter clusters
  const filtered = clusters.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.locality.toLowerCase().includes(term) ||
      item.pincode.includes(term) ||
      item.city.toLowerCase().includes(term) ||
      item.top_scam_type.toLowerCase().includes(term)
    );
  });

  // Sort clusters
  const sorted = [...filtered].sort((a, b) => {
    if (sortField === "count") {
      return sortAsc ? a.count - b.count : b.count - a.count;
    }
    if (sortField === "pincode") {
      return sortAsc
        ? a.pincode.localeCompare(b.pincode)
        : b.pincode.localeCompare(a.pincode);
    }
    if (sortField === "locality") {
      return sortAsc
        ? a.locality.localeCompare(b.locality)
        : b.locality.localeCompare(a.locality);
    }
    if (sortField === "severity") {
      const rank: Record<string, number> = { CRIT: 3, HIGH: 2, MED: 1 };
      const rankA = rank[a.severity?.toUpperCase()] || 0;
      const rankB = rank[b.severity?.toUpperCase()] || 0;
      return sortAsc ? rankA - rankB : rankB - rankA;
    }
    return 0;
  });

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div
      className={`rounded-[2rem] border border-[#EAE6FD] bg-white p-4 sm:p-5 flex flex-col h-[520px] md:h-[620px] shadow-xl shadow-[#6035E8]/5 text-[#171638] ${className}`}
    >
      {/* Header & Search */}
      <div className="pb-3 border-b border-[#EAE6FD] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#6035E8]/10 text-[#6035E8]">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs sm:text-sm font-black text-[#171638] uppercase tracking-wider">
              Scam Clusters Directory
            </h3>
          </div>
          <span className="text-xs font-mono text-[#837FA8] font-bold">
            {filtered.length} of {clusters.length}
          </span>
        </div>

        {/* Search input */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by locality, city, or PIN..."
          className="w-full h-10 px-3.5 rounded-xl bg-[#F6F4FE] border border-[#EAE6FD] hover:border-[#6035E8]/40 focus:border-[#6035E8] focus:bg-white text-xs text-[#171638] placeholder:text-[#837FA8] outline-none transition-colors"
        />

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
          <span className="text-[#837FA8] font-bold flex items-center gap-1 shrink-0 mr-1">
            <ArrowUpDown className="w-3 h-3 text-[#837FA8]" /> Sort:
          </span>
          <button
            type="button"
            onClick={() => handleToggleSort("count")}
            className={`px-2.5 py-1 rounded-full transition-all shrink-0 cursor-pointer ${
              sortField === "count"
                ? "bg-[#6035E8] text-white font-bold shadow-xs"
                : "text-[#545277] bg-[#F0EDFF] hover:bg-[#E5DEFF] hover:text-[#171638]"
            }`}
          >
            Reports {sortField === "count" && (sortAsc ? "↑" : "↓")}
          </button>
          <button
            type="button"
            onClick={() => handleToggleSort("severity")}
            className={`px-2.5 py-1 rounded-full transition-all shrink-0 cursor-pointer ${
              sortField === "severity"
                ? "bg-[#6035E8] text-white font-bold shadow-xs"
                : "text-[#545277] bg-[#F0EDFF] hover:bg-[#E5DEFF] hover:text-[#171638]"
            }`}
          >
            Severity {sortField === "severity" && (sortAsc ? "↑" : "↓")}
          </button>
          <button
            type="button"
            onClick={() => handleToggleSort("locality")}
            className={`px-2.5 py-1 rounded-full transition-all shrink-0 cursor-pointer ${
              sortField === "locality"
                ? "bg-[#6035E8] text-white font-bold shadow-xs"
                : "text-[#545277] bg-[#F0EDFF] hover:bg-[#E5DEFF] hover:text-[#171638]"
            }`}
          >
            Area {sortField === "locality" && (sortAsc ? "↑" : "↓")}
          </button>
          <button
            type="button"
            onClick={() => handleToggleSort("pincode")}
            className={`px-2.5 py-1 rounded-full transition-all shrink-0 cursor-pointer ${
              sortField === "pincode"
                ? "bg-[#6035E8] text-white font-bold shadow-xs"
                : "text-[#545277] bg-[#F0EDFF] hover:bg-[#E5DEFF] hover:text-[#171638]"
            }`}
          >
            PIN {sortField === "pincode" && (sortAsc ? "↑" : "↓")}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1">
        {sorted.length === 0 ? (
          <div className="text-center py-12 text-[#837FA8] text-xs font-medium">
            No clusters match &quot;{searchTerm}&quot;.
          </div>
        ) : (
          sorted.map((item) => {
            const isSelected =
              selectedCluster?.pincode === item.pincode &&
              selectedCluster?.locality === item.locality;
            const sev = item.severity?.toUpperCase();

            return (
              <div
                key={`${item.pincode}-${item.locality}`}
                onClick={() => onSelectCluster(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectCluster(item);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6035E8] ${
                  isSelected
                    ? "bg-[#F0EDFF] border-[#6035E8] shadow-sm"
                    : "bg-[#F6F4FE]/70 border-[#EAE6FD] hover:bg-[#F0EDFF]/50 hover:border-[#6035E8]/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#6035E8] shrink-0" />
                      <span className="font-bold text-[#171638] text-sm">
                        {item.locality}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#545277] font-medium">
                      {item.city} • <span className="font-mono text-[#171638] font-bold">{item.pincode}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-black font-mono text-[#08C9C5]">
                        {item.count}
                      </span>
                      <span className="text-[10px] text-[#837FA8] block -mt-0.5 font-medium">
                        reports
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#837FA8]" />
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#EAE6FD] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#545277] font-medium truncate max-w-[160px]">
                    {getScamTypeLabel(item.top_scam_type)}
                  </span>
                  <StatusBadge
                    status={
                      sev === "CRIT"
                        ? "critical"
                        : sev === "HIGH"
                        ? "high"
                        : "medium"
                    }
                    label={sev}
                    size="sm"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ClusterListView;
