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
      className={`rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 flex flex-col h-[520px] md:h-[620px] ${className}`}
    >
      {/* Header & Search */}
      <div className="pb-3 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Scam Clusters Directory
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {filtered.length} of {clusters.length}
          </span>
        </div>

        {/* Search input */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by locality, city, or PIN..."
          className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700/80 hover:border-slate-600 focus:border-teal-500 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
        />

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
          <span className="text-slate-400 flex items-center gap-1 shrink-0 mr-1">
            <ArrowUpDown className="w-3 h-3 text-slate-400" /> Sort:
          </span>
          <button
            type="button"
            onClick={() => handleToggleSort("count")}
            className={`px-2 py-1 rounded-md transition-colors shrink-0 ${
              sortField === "count"
                ? "bg-teal-500/20 text-teal-300 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Reports {sortField === "count" && (sortAsc ? "↑" : "↓")}
          </button>
          <button
            type="button"
            onClick={() => handleToggleSort("severity")}
            className={`px-2 py-1 rounded-md transition-colors shrink-0 ${
              sortField === "severity"
                ? "bg-teal-500/20 text-teal-300 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Severity {sortField === "severity" && (sortAsc ? "↑" : "↓")}
          </button>
          <button
            type="button"
            onClick={() => handleToggleSort("locality")}
            className={`px-2 py-1 rounded-md transition-colors shrink-0 ${
              sortField === "locality"
                ? "bg-teal-500/20 text-teal-300 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Area {sortField === "locality" && (sortAsc ? "↑" : "↓")}
          </button>
          <button
            type="button"
            onClick={() => handleToggleSort("pincode")}
            className={`px-2 py-1 rounded-md transition-colors shrink-0 ${
              sortField === "pincode"
                ? "bg-teal-500/20 text-teal-300 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            PIN {sortField === "pincode" && (sortAsc ? "↑" : "↓")}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1">
        {sorted.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
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
                className={`p-3 rounded-xl border transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                  isSelected
                    ? "bg-teal-950/40 border-teal-500/60 shadow-md"
                    : "bg-slate-950/50 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="font-semibold text-slate-100 text-sm">
                        {item.locality}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {item.city} • <span className="font-mono text-slate-300">{item.pincode}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-teal-300">
                        {item.count}
                      </span>
                      <span className="text-[10px] text-slate-400 block -mt-0.5">
                        reports
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 truncate max-w-[160px]">
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
