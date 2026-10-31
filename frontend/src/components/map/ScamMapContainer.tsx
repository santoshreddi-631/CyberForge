"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Search,
  RotateCcw,
  MapPin,
  Flame,
  Activity,
  Layers,
  EyeOff,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { apiClient, ApiError } from "@/lib/api/client";
import { MapClusterItem, MapResponseContract } from "@/lib/contracts";
import { MONITORED_AREAS } from "@/lib/constants/reportOptions";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { GeospatialMapView } from "./GeospatialMapView";
import { ClusterDetailCard, getScamTypeLabel } from "./ClusterDetailCard";
import { ClusterListView } from "./ClusterListView";

type FetchState =
  | { status: "loading" }
  | { status: "success"; data: MapResponseContract }
  | { status: "error"; message: string; isNetworkError: boolean };

export function ScamMapContainer() {
  const [fetchState, setFetchState] = useState<FetchState>({ status: "loading" });
  const [selectedCluster, setSelectedCluster] = useState<MapClusterItem | null>(null);
  const [pincodeFilter, setPincodeFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"map" | "list" | "split">("split");

  // Fetch map clusters from backend GET /map (used by user actions)
  const loadMapData = useCallback(async (pincode?: string) => {
    setFetchState({ status: "loading" });
    setSelectedCluster(null);

    try {
      // Standard 7 days window and 2 km radius per PRD specifications
      const params: Record<string, string | number> = {
        days: 7,
      };

      if (pincode && pincode.trim().length > 0) {
        params.pincode = pincode.trim();
        params.radius_km = 2;
      }

      const response = await apiClient.get<MapResponseContract>("/map", { params });

      // Validate response structure
      if (!response || !Array.isArray(response.clusters)) {
        setFetchState({
          status: "error",
          message: "The server returned an unexpected map response schema.",
          isNetworkError: false,
        });
        return;
      }

      setFetchState({ status: "success", data: response });

      // Auto-select first cluster if available
      if (response.clusters.length > 0) {
        setSelectedCluster(response.clusters[0]);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFetchState({
          status: "error",
          message:
            err.message ||
            `API error (${err.status}): Could not load map clusters from GET /map.`,
          isNetworkError: err.status === 0,
        });
      } else {
        setFetchState({
          status: "error",
          message: "Unable to establish connection with the intelligence server.",
          isNetworkError: true,
        });
      }
    }
  }, []);

  // Initial load on mount (purely asynchronous to avoid cascading renders)
  useEffect(() => {
    let ignore = false;

    async function fetchInitialData() {
      try {
        const response = await apiClient.get<MapResponseContract>("/map", {
          params: { days: 7 },
        });

        if (!ignore) {
          if (!response || !Array.isArray(response.clusters)) {
            setFetchState({
              status: "error",
              message: "The server returned an unexpected map response schema.",
              isNetworkError: false,
            });
            return;
          }

          setFetchState({ status: "success", data: response });
          if (response.clusters.length > 0) {
            setSelectedCluster(response.clusters[0]);
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof ApiError) {
            setFetchState({
              status: "error",
              message:
                err.message ||
                `API error (${err.status}): Could not load map clusters from GET /map.`,
              isNetworkError: err.status === 0,
            });
          } else {
            setFetchState({
              status: "error",
              message: "Unable to establish connection with the intelligence server.",
              isNetworkError: true,
            });
          }
        }
      }
    }

    fetchInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  const handleApplyPincodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMapData(pincodeFilter);
  };

  const handleClearFilter = () => {
    setPincodeFilter("");
    setCityFilter("ALL");
    loadMapData();
  };

  // Derive unique cities from monitored areas or returned clusters
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    MONITORED_AREAS.forEach((a) => set.add(a.city));
    if (fetchState.status === "success") {
      fetchState.data.clusters.forEach((c) => set.add(c.city));
    }
    return Array.from(set).sort();
  }, [fetchState]);

  // Filter clusters by city if selected
  const displayedClusters = useMemo(() => {
    if (fetchState.status !== "success") return [];
    if (cityFilter === "ALL") return fetchState.data.clusters;
    return fetchState.data.clusters.filter((c) => c.city.toLowerCase() === cityFilter.toLowerCase());
  }, [fetchState, cityFilter]);

  // Derived summary metrics from ACTUAL data only
  const summaryMetrics = useMemo(() => {
    if (fetchState.status !== "success" || fetchState.data.clusters.length === 0) {
      return null;
    }

    const clusters = fetchState.data.clusters;
    const totalReports = clusters.reduce((acc, c) => acc + (c.count || 0), 0);
    const criticalHotspots = clusters.filter(
      (c) => c.severity?.toUpperCase() === "CRIT"
    ).length;

    // Find top scam type across all clusters
    const typeCount: Record<string, number> = {};
    clusters.forEach((c) => {
      if (c.top_scam_type) {
        typeCount[c.top_scam_type] = (typeCount[c.top_scam_type] || 0) + (c.count || 1);
      }
    });

    let topType = "N/A";
    let maxCount = 0;
    Object.entries(typeCount).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topType = type;
      }
    });

    return {
      activeClusters: clusters.length,
      totalReports,
      criticalHotspots,
      dominantPattern: topType !== "N/A" ? getScamTypeLabel(topType) : "None reported",
    };
  }, [fetchState]);

  return (
    <div className="space-y-6">
      {/* ── Privacy and Safeguard Banner ────────────────────────────── */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-start gap-3">
          <EyeOff className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-100 block">
              Privacy and Safe Mapping Standard
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px] sm:text-xs">
              This map displays aggregated community reports over the last 7 days. Exact reporter GPS coordinates, residential addresses, and phone numbers are never stored or exposed.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            7-Day Standard
          </span>
        </div>
      </div>

      {/* ── Controls Toolbar ────────────────────────────────────────── */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Pincode & City Filter Form */}
          <form
            onSubmit={handleApplyPincodeSearch}
            className="flex flex-wrap items-center gap-2.5 flex-1"
          >
            {/* City selector */}
            <div className="relative min-w-[140px]">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                aria-label="Filter clusters by city"
                className="w-full h-10 px-3 pr-8 rounded-lg bg-slate-950 border border-slate-700/80 hover:border-slate-600 focus:border-teal-500 text-xs text-slate-200 outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="ALL">All Monitored Cities</option>
                {availableCities.map((city) => (
                  <option key={city} value={city} className="bg-slate-900 text-slate-100">
                    {city}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Pincode search input */}
            <div className="relative flex-1 sm:max-w-xs">
              <input
                type="text"
                inputMode="numeric"
                value={pincodeFilter}
                onChange={(e) => setPincodeFilter(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Filter by 6-digit PIN code..."
                className="w-full h-10 px-3 pl-9 rounded-lg bg-slate-950 border border-slate-700/80 hover:border-slate-600 focus:border-teal-500 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-colors font-mono"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            <PrimaryButton
              type="submit"
              variant="secondary"
              size="sm"
              className="text-xs"
            >
              Filter PIN
            </PrimaryButton>

            {(pincodeFilter || cityFilter !== "ALL") && (
              <button
                type="button"
                onClick={handleClearFilter}
                className="text-xs text-teal-400 hover:text-teal-300 underline underline-offset-4 px-2"
              >
                Clear Filters
              </button>
            )}
          </form>

          {/* View mode toggle (Map / List / Split) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "map"
                  ? "bg-teal-500/20 text-teal-300 font-semibold shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Map Only
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`hidden lg:block px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "split"
                  ? "bg-teal-500/20 text-teal-300 font-semibold shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-teal-500/20 text-teal-300 font-semibold shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Directory
            </button>
            <button
              type="button"
              onClick={() => loadMapData(pincodeFilter)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors ml-1"
              title="Refresh map data"
              aria-label="Refresh map data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Metrics (Rendered ONLY from real API data) ────────── */}
      {summaryMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>Active Clusters</span>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100">
              {summaryMetrics.activeClusters}
            </p>
            <p className="text-[10px] text-slate-400">monitored localities</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span>7-Day Reports</span>
            </div>
            <p className="text-2xl font-bold font-mono text-teal-300">
              {summaryMetrics.totalReports}
            </p>
            <p className="text-[10px] text-slate-400">verified community reports</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Critical Hotspots</span>
            </div>
            <p className="text-2xl font-bold font-mono text-rose-300">
              {summaryMetrics.criticalHotspots}
            </p>
            <p className="text-[10px] text-slate-400">CRIT severity areas</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Dominant Pattern</span>
            </div>
            <p className="text-sm font-bold text-slate-100 truncate mt-1">
              {summaryMetrics.dominantPattern}
            </p>
            <p className="text-[10px] text-slate-400">most frequent category</p>
          </div>
        </div>
      )}

      {/* ── Main Content Body ───────────────────────────────────────── */}
      {fetchState.status === "loading" && (
        <div className="space-y-4">
          <LoadingSkeleton className="h-[520px] rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LoadingSkeleton variant="card" className="h-24 rounded-xl" />
            <LoadingSkeleton variant="card" className="h-24 rounded-xl" />
            <LoadingSkeleton variant="card" className="h-24 rounded-xl" />
          </div>
        </div>
      )}

      {fetchState.status === "error" && (
        <ErrorState
          title="Scam Map Intelligence Unavailable"
          description={fetchState.message}
          onRetry={() => loadMapData(pincodeFilter)}
          action={
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
              <PrimaryButton
                variant="secondary"
                size="md"
                onClick={() => loadMapData(pincodeFilter)}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Retry Connection
              </PrimaryButton>
              <Link href="/lookup">
                <PrimaryButton variant="outline" size="md" leftIcon={<Search className="w-4 h-4" />}>
                  Check an Identifier
                </PrimaryButton>
              </Link>
              <Link href="/report">
                <PrimaryButton variant="primary" size="md" leftIcon={<ShieldAlert className="w-4 h-4" />}>
                  Report Incident
                </PrimaryButton>
              </Link>
            </div>
          }
        />
      )}

      {fetchState.status === "success" && displayedClusters.length === 0 && (
        <EmptyState
          title="No Scam Clusters Found"
          description={
            pincodeFilter || cityFilter !== "ALL"
              ? `No scam clusters recorded for the filtered location over the past 7 days. Try clearing filters to view all monitored areas.`
              : `No scam clusters reported across any monitored areas in the last 7 days. Stay alert and report suspicious attempts to help keep your neighborhood secure.`
          }
          action={
            <div className="flex items-center gap-3">
              {(pincodeFilter || cityFilter !== "ALL") && (
                <PrimaryButton
                  variant="secondary"
                  size="sm"
                  onClick={handleClearFilter}
                >
                  Clear Filters
                </PrimaryButton>
              )}
              <Link href="/report">
                <PrimaryButton
                  variant="primary"
                  size="sm"
                  leftIcon={<ShieldAlert className="w-4 h-4" />}
                >
                  Submit a Scam Report
                </PrimaryButton>
              </Link>
            </div>
          }
        />
      )}

      {fetchState.status === "success" && displayedClusters.length > 0 && (
        <div className="space-y-4">
          {/* Main Visual Layout */}
          {viewMode === "split" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Map Canvas - Left 8 columns */}
              <div className="lg:col-span-8 space-y-4">
                <GeospatialMapView
                  clusters={displayedClusters}
                  selectedCluster={selectedCluster}
                  onSelectCluster={(cluster) => setSelectedCluster(cluster)}
                />
              </div>

              {/* Sidebar / Detail card or directory - Right 4 columns */}
              <div className="lg:col-span-4 space-y-4">
                {selectedCluster ? (
                  <ClusterDetailCard
                    cluster={selectedCluster}
                    onClose={() => setSelectedCluster(null)}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-center text-slate-400 space-y-2">
                    <MapPin className="w-6 h-6 mx-auto text-slate-500" />
                    <p className="text-sm font-semibold text-slate-300">
                      Select an Area on the Map
                    </p>
                    <p className="text-xs text-slate-400">
                      Click any marker or cluster to inspect 7-day incident volume and top scam patterns.
                    </p>
                  </div>
                )}

                {/* Directory Mini-list below detail card */}
                <ClusterListView
                  clusters={displayedClusters}
                  selectedCluster={selectedCluster}
                  onSelectCluster={(cluster) => setSelectedCluster(cluster)}
                  className="max-h-[380px]"
                />
              </div>
            </div>
          )}

          {viewMode === "map" && (
            <div className="space-y-4">
              <GeospatialMapView
                clusters={displayedClusters}
                selectedCluster={selectedCluster}
                onSelectCluster={(cluster) => setSelectedCluster(cluster)}
              />

              {selectedCluster && (
                <div className="max-w-xl mx-auto">
                  <ClusterDetailCard
                    cluster={selectedCluster}
                    onClose={() => setSelectedCluster(null)}
                  />
                </div>
              )}
            </div>
          )}

          {viewMode === "list" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              <div className="md:col-span-7">
                <ClusterListView
                  clusters={displayedClusters}
                  selectedCluster={selectedCluster}
                  onSelectCluster={(cluster) => setSelectedCluster(cluster)}
                />
              </div>
              <div className="md:col-span-5">
                {selectedCluster ? (
                  <ClusterDetailCard
                    cluster={selectedCluster}
                    onClose={() => setSelectedCluster(null)}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400 space-y-2">
                    <MapPin className="w-6 h-6 mx-auto text-slate-500" />
                    <p className="text-sm font-semibold text-slate-300">
                      Select a Cluster
                    </p>
                    <p className="text-xs text-slate-400">
                      Click any item from the directory to review aggregated metrics and patterns.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Help and Navigation Shortcuts ───────────────────────────── */}
      <div className="rounded-xl bg-slate-900/40 border border-slate-800 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-sm font-semibold text-slate-200">
            Have you encountered suspicious calls or messages in your area?
          </h4>
          <p className="text-xs text-slate-400">
            Help alert citizens in your neighborhood by reporting unknown callers, fake KYC messages, or payment scams.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/lookup">
            <PrimaryButton variant="outline" size="sm" leftIcon={<Search className="w-3.5 h-3.5" />}>
              Lookup
            </PrimaryButton>
          </Link>
          <Link href="/report">
            <PrimaryButton variant="primary" size="sm" leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}>
              Report Scam
            </PrimaryButton>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ScamMapContainer;
