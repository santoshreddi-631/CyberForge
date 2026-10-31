"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  RotateCcw,
  MapPin,
  Flame,
  Activity,
  Layers,
  EyeOff,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";
import { apiClient, ApiError } from "@/lib/api/client";
import {
  MapClusterItem,
  MapResponseContract,
  MapGeoJsonFeature,
} from "@/lib/contracts";
import {
  MONITORED_AREAS,
  REPORT_SCAM_TYPES,
} from "@/lib/constants/reportOptions";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useLanguage } from "@/hooks/useLanguage";
import { ClusterDetailCard, getScamTypeLabel } from "./ClusterDetailCard";
import { ClusterListView } from "./ClusterListView";

// Dynamically import MapLibre map component to avoid SSR/window issues in Next.js
const GeospatialMapView = dynamic(
  () =>
    import("./GeospatialMapView").then((mod) => mod.GeospatialMapView),
  {
    ssr: false,
    loading: () => (
      <LoadingSkeleton className="h-[580px] sm:h-[620px] rounded-2xl" />
    ),
  }
);

type FetchState =
  | { status: "loading" }
  | { status: "success"; data: MapResponseContract }
  | { status: "error"; message: string; isNetworkError: boolean };

const POLL_INTERVAL_MS = 25000; // Real-time background sync every 25 seconds

export function ScamMapContainer() {
  const { lang, t } = useLanguage();
  const isHi = lang === "hi";

  const [fetchState, setFetchState] = useState<FetchState>({
    status: "loading",
  });
  const [selectedCluster, setSelectedCluster] = useState<MapClusterItem | null>(
    null
  );
  const [pincodeFilter, setPincodeFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("ALL");
  const [timeFilter, setTimeFilter] = useState<1 | 7 | 30>(7);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"map" | "list" | "split">("split");

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);

  // Core fetch function with abort signal and concurrency guard
  const fetchMapData = useCallback(
    async (
      options: {
        pincode?: string;
        days?: number;
        category?: string;
        isBackground?: boolean;
      } = {}
    ) => {
      // Abort previous in-flight request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      isFetchingRef.current = true;

      const isBackground = options.isBackground ?? false;
      if (isBackground) {
        setIsRefreshing(true);
      } else {
        setFetchState({ status: "loading" });
        setSelectedCluster(null);
      }

      try {
        const queryDays = options.days !== undefined ? options.days : timeFilter;
        const queryCategory =
          options.category !== undefined ? options.category : categoryFilter;
        const queryPincode =
          options.pincode !== undefined ? options.pincode : pincodeFilter;

        const params: Record<string, string | number> = {
          days: queryDays,
          radius_km: 2,
          format: "geojson",
        };

        if (queryPincode && queryPincode.trim().length > 0) {
          params.pincode = queryPincode.trim();
        }

        if (queryCategory && queryCategory !== "ALL") {
          params.category = queryCategory;
        }

        // Prefer /api/v1/map endpoint
        const response = await apiClient.get<MapResponseContract>(
          "/api/v1/map",
          {
            params,
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted) return;

        // Ensure clusters array exists
        const clusters = response?.clusters || [];
        const normalizedData: MapResponseContract = {
          ...response,
          clusters,
          features: response?.features || [],
        };

        setFetchState({ status: "success", data: normalizedData });
        setLastUpdated(new Date());

        // Select first cluster if none currently selected
        if (clusters.length > 0 && !selectedCluster) {
          setSelectedCluster(clusters[0]);
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;

        console.error("ScamMap fetch error:", err);

        // If background refresh fails, preserve existing data
        if (!isBackground) {
          if (err instanceof ApiError) {
            setFetchState({
              status: "error",
              message:
                err.message ||
                (isHi
                  ? `API त्रुटि (${err.status}): नक़्शा डेटा लोड नहीं हो सका।`
                  : `API error (${err.status}): Could not load map data.`),
              isNetworkError: err.status === 0,
            });
          } else {
            setFetchState({
              status: "error",
              message: isHi
                ? "सुरक्षा सर्वर से कनेक्शन स्थापित करने में असमर्थ।"
                : "Unable to establish connection with the intelligence server.",
              isNetworkError: true,
            });
          }
        }
      } finally {
        isFetchingRef.current = false;
        setIsRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timeFilter, categoryFilter, pincodeFilter, isHi]
  );

  // Trigger load when timeFilter or categoryFilter changes
  useEffect(() => {
    fetchMapData({ days: timeFilter, category: categoryFilter, pincode: pincodeFilter });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter, categoryFilter]);

  // Periodic background sync (every 25 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      // Avoid sync if tab is hidden or a fetch is currently in progress
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }
      if (isFetchingRef.current) return;

      fetchMapData({
        days: timeFilter,
        category: categoryFilter,
        pincode: pincodeFilter,
        isBackground: true,
      });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [timeFilter, categoryFilter, pincodeFilter, fetchMapData]);

  const handleApplyPincodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMapData({ pincode: pincodeFilter });
  };

  const handleClearFilter = () => {
    setPincodeFilter("");
    setCityFilter("ALL");
    setCategoryFilter("ALL");
    setTimeFilter(7);
    fetchMapData({ pincode: "", category: "ALL", days: 7 });
  };

  // Derive unique cities
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    MONITORED_AREAS.forEach((a) => set.add(a.city));
    if (fetchState.status === "success" && fetchState.data.clusters) {
      fetchState.data.clusters.forEach((c) => {
        if (c.city) set.add(c.city);
      });
    }
    return Array.from(set).sort();
  }, [fetchState]);

  // Filter clusters by city if selected
  const displayedClusters = useMemo(() => {
    if (fetchState.status !== "success" || !fetchState.data.clusters) return [];
    if (cityFilter === "ALL") return fetchState.data.clusters;
    return fetchState.data.clusters.filter(
      (c) => c.city.toLowerCase() === cityFilter.toLowerCase()
    );
  }, [fetchState, cityFilter]);

  // Filter GeoJSON features by city if selected
  const displayedFeatures = useMemo((): MapGeoJsonFeature[] => {
    if (fetchState.status !== "success" || !fetchState.data.features) return [];
    if (cityFilter === "ALL") return fetchState.data.features;
    return fetchState.data.features.filter(
      (f) =>
        f.properties?.city?.toLowerCase() === cityFilter.toLowerCase()
    );
  }, [fetchState, cityFilter]);

  // Derived target coordinates when searching by PIN code
  const searchedCoordinates = useMemo((): [number, number] | null => {
    if (!pincodeFilter.trim()) return null;
    const found = MONITORED_AREAS.find((a) => a.code === pincodeFilter.trim());
    if (found) return [found.lng, found.lat];
    return null;
  }, [pincodeFilter]);

  // Derived summary metrics
  const summaryMetrics = useMemo(() => {
    if (
      fetchState.status !== "success" ||
      !fetchState.data.clusters ||
      fetchState.data.clusters.length === 0
    ) {
      return null;
    }

    const clusters = displayedClusters;
    const totalReports =
      fetchState.data.total_reports !== undefined
        ? fetchState.data.total_reports
        : clusters.reduce((acc, c) => acc + (c.count || 0), 0);

    const criticalHotspots = clusters.filter(
      (c) => c.severity?.toUpperCase() === "CRIT"
    ).length;

    // Dominant scam type across all clusters
    const typeCount: Record<string, number> = {};
    clusters.forEach((c) => {
      if (c.top_scam_type) {
        typeCount[c.top_scam_type] =
          (typeCount[c.top_scam_type] || 0) + (c.count || 1);
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
      dominantPattern:
        topType !== "N/A"
          ? getScamTypeLabel(topType, isHi)
          : isHi
          ? "कोई दर्ज नहीं"
          : "None reported",
    };
  }, [fetchState, displayedClusters, isHi]);

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) return null;
    return lastUpdated.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [lastUpdated]);

  return (
    <div className="space-y-6">
      {/* ── Privacy and Safeguard Banner ────────────────────────────── */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-start gap-3">
          <EyeOff className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-100 block">
              {isHi
                ? "गोपनीयता और सुरक्षित मानचित्रण मानक"
                : "Privacy and Safe Mapping Standard"}
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px] sm:text-xs">
              {isHi
                ? `यह मानचित्र पिछले ${timeFilter === 1 ? "24 घंटों" : `${timeFilter} दिनों`} की समूहीकृत रिपोर्ट प्रदर्शित करता है। व्यक्तिगत जीपीएस निर्देशांक, पते या फ़ोन नंबर कभी उजागर नहीं किए जाते।`
                : `This map displays aggregated community reports over the last ${
                    timeFilter === 1 ? "24 hours" : `${timeFilter} days`
                  }. Exact reporter GPS coordinates, residential addresses, and personal identities are never exposed.`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {timeFilter === 1
              ? isHi
                ? "24-घंटे फ़िल्टर"
                : "24-Hour Window"
              : isHi
              ? `${timeFilter}-दिवसीय मानक`
              : `${timeFilter}-Day Standard`}
          </span>
        </div>
      </div>

      {/* ── Controls Toolbar ────────────────────────────────────────── */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Time Filter Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setTimeFilter(1)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  timeFilter === 1
                    ? "bg-teal-500/20 text-teal-300 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Last 24 Hours"
              >
                24h
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter(7)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  timeFilter === 7
                    ? "bg-teal-500/20 text-teal-300 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Last 7 Days"
              >
                7d
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter(30)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  timeFilter === 30
                    ? "bg-teal-500/20 text-teal-300 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Last 30 Days"
              >
                30d
              </button>
            </div>

            {/* Scam Category Selector */}
            <div className="relative min-w-[170px] max-w-[210px]">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by scam category"
                className="w-full h-9 px-3 pr-8 rounded-lg bg-slate-950 border border-slate-700/80 hover:border-slate-600 focus:border-teal-500 text-xs text-slate-200 outline-none transition-colors appearance-none cursor-pointer truncate"
              >
                <option value="ALL">
                  {isHi ? "सभी श्रेणियां" : "All Scam Categories"}
                </option>
                {REPORT_SCAM_TYPES.map((cat) => (
                  <option
                    key={cat.type}
                    value={cat.type}
                    className="bg-slate-900 text-slate-100"
                  >
                    {cat.label}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* City Selector */}
            <div className="relative min-w-[130px]">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                aria-label="Filter clusters by city"
                className="w-full h-9 px-3 pr-8 rounded-lg bg-slate-950 border border-slate-700/80 hover:border-slate-600 focus:border-teal-500 text-xs text-slate-200 outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="ALL">{t.map.allCities}</option>
                {availableCities.map((city) => (
                  <option
                    key={city}
                    value={city}
                    className="bg-slate-900 text-slate-100"
                  >
                    {city}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Pincode Search Input */}
            <form
              onSubmit={handleApplyPincodeSearch}
              className="flex items-center gap-1.5 flex-1 min-w-[160px] sm:max-w-xs"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  value={pincodeFilter}
                  onChange={(e) =>
                    setPincodeFilter(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  placeholder={
                    isHi ? "6-अंकों का पिन कोड..." : "6-digit PIN..."
                  }
                  className="w-full h-9 px-3 pl-8 rounded-lg bg-slate-950 border border-slate-700/80 hover:border-slate-600 focus:border-teal-500 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-colors font-mono"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>

              <PrimaryButton
                type="submit"
                variant="secondary"
                size="sm"
                className="h-9 text-xs px-2.5"
              >
                {t.map.filterPin}
              </PrimaryButton>
            </form>

            {(pincodeFilter ||
              cityFilter !== "ALL" ||
              categoryFilter !== "ALL" ||
              timeFilter !== 7) && (
              <button
                type="button"
                onClick={handleClearFilter}
                className="text-xs text-teal-400 hover:text-teal-300 underline underline-offset-4 px-1 shrink-0"
              >
                {t.map.clearFilters}
              </button>
            )}
          </div>

          {/* Right Toolbar: View mode toggles & Real-time Status */}
          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-auto">
            {/* Real-time sync indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRefreshing
                    ? "bg-amber-400 animate-ping"
                    : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                }`}
              />
              <span>
                {isRefreshing
                  ? isHi
                    ? "अपडेट हो रहा है..."
                    : "Syncing..."
                  : formattedLastUpdated
                  ? formattedLastUpdated
                  : isHi
                  ? "लाइव"
                  : "Live"}
              </span>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "map"
                    ? "bg-teal-500/20 text-teal-300 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.map.mapOnly}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={`hidden lg:block px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "split"
                    ? "bg-teal-500/20 text-teal-300 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.map.splitView}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-teal-500/20 text-teal-300 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.map.directory}
              </button>
              <button
                type="button"
                onClick={() =>
                  fetchMapData({
                    days: timeFilter,
                    category: categoryFilter,
                    pincode: pincodeFilter,
                  })
                }
                disabled={isRefreshing}
                className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors ml-0.5 disabled:opacity-50"
                title={isHi ? "डेटा रीफ्रेश करें" : "Refresh map data"}
                aria-label={isHi ? "डेटा रीफ्रेश करें" : "Refresh map data"}
              >
                <RotateCcw
                  className={`w-3.5 h-3.5 ${
                    isRefreshing ? "animate-spin text-teal-400" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary Metrics ─────────────────────────────────────────── */}
      {summaryMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>{t.map.activeClusters}</span>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100">
              {summaryMetrics.activeClusters}
            </p>
            <p className="text-[10px] text-slate-400">
              {isHi ? "निगरानी किए जा रहे क्षेत्र" : "monitored localities"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span>
                {timeFilter === 1
                  ? isHi
                    ? "24 घंटों में रिपोर्टें"
                    : "24h Reports"
                  : timeFilter === 30
                  ? isHi
                    ? "30 दिनों में रिपोर्टें"
                    : "30d Reports"
                  : t.map.reports7Days}
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-teal-300">
              {summaryMetrics.totalReports}
            </p>
            <p className="text-[10px] text-slate-400">
              {isHi
                ? "समूहीकृत नागरिक रिपोर्टें"
                : "aggregated community reports"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.map.criticalHotspots}</span>
            </div>
            <p className="text-2xl font-bold font-mono text-rose-300">
              {summaryMetrics.criticalHotspots}
            </p>
            <p className="text-[10px] text-slate-400">
              {isHi ? "गंभीर (CRIT) क्षेत्र" : "CRIT severity areas"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.map.dominantPattern}</span>
            </div>
            <p className="text-sm font-bold text-slate-100 truncate mt-1">
              {summaryMetrics.dominantPattern}
            </p>
            <p className="text-[10px] text-slate-400">
              {isHi ? "सर्वाधिक दर्ज श्रेणी" : "most frequent category"}
            </p>
          </div>
        </div>
      )}

      {/* ── Main Content Body ───────────────────────────────────────── */}
      {fetchState.status === "loading" && (
        <div className="space-y-4">
          <LoadingSkeleton className="h-[580px] sm:h-[620px] rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LoadingSkeleton variant="card" className="h-24 rounded-xl" />
            <LoadingSkeleton variant="card" className="h-24 rounded-xl" />
            <LoadingSkeleton variant="card" className="h-24 rounded-xl" />
          </div>
        </div>
      )}

      {fetchState.status === "error" && (
        <ErrorState
          title={
            isHi
              ? "नक्शा डेटा उपलब्ध नहीं है"
              : "Scam Map Intelligence Unavailable"
          }
          description={fetchState.message}
          onRetry={() =>
            fetchMapData({
              days: timeFilter,
              category: categoryFilter,
              pincode: pincodeFilter,
            })
          }
          action={
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
              <PrimaryButton
                variant="secondary"
                size="md"
                onClick={() =>
                  fetchMapData({
                    days: timeFilter,
                    category: categoryFilter,
                    pincode: pincodeFilter,
                  })
                }
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                {isHi ? "पुनः प्रयास करें" : "Retry Connection"}
              </PrimaryButton>
              <Link href="/lookup">
                <PrimaryButton
                  variant="outline"
                  size="md"
                  leftIcon={<Search className="w-4 h-4" />}
                >
                  {isHi ? t.lookup.checkAnother : "Check an Identifier"}
                </PrimaryButton>
              </Link>
              <Link href="/report">
                <PrimaryButton
                  variant="primary"
                  size="md"
                  leftIcon={<ShieldAlert className="w-4 h-4" />}
                >
                  {isHi ? t.home.reportIncident : "Report Incident"}
                </PrimaryButton>
              </Link>
            </div>
          }
        />
      )}

      {fetchState.status === "success" && (
        <div className="space-y-4">
          {/* Informational banner when 0 clusters match current filters */}
          {displayedClusters.length === 0 && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {pincodeFilter || cityFilter !== "ALL" || categoryFilter !== "ALL"
                    ? isHi
                      ? `चुने गए फ़िल्टर (${pincodeFilter ? `पिन: ${pincodeFilter} ` : ""}${cityFilter !== "ALL" ? `शहर: ${cityFilter} ` : ""}) के लिए पिछले ${timeFilter} दिनों में 0 स्कैम क्लस्टर दर्ज हैं। यह क्षेत्र वर्तमान में सुरक्षित है।`
                      : `Zero scam clusters recorded for active filter (${pincodeFilter ? `PIN: ${pincodeFilter} ` : ""}${cityFilter !== "ALL" ? `City: ${cityFilter} ` : ""}) over the selected window (${timeFilter}d). This area is currently clear of reported fraud.`
                    : isHi
                    ? `इस समय अंतराल में कोई सक्रिय स्कैम क्लस्टर रिपोर्ट नहीं हुआ। सतर्क रहें और संदिग्ध गतिविधियों की रिपोर्ट करें।`
                    : `No scam clusters reported across monitored areas in this time window. Stay alert and report suspicious attempts.`}
                </span>
              </div>
              {(pincodeFilter || cityFilter !== "ALL" || categoryFilter !== "ALL" || timeFilter !== 7) && (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  className="inline-flex items-center gap-1 font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2 shrink-0 self-start sm:self-auto"
                >
                  {t.map.clearFilters}
                </button>
              )}
            </div>
          )}

          {viewMode === "split" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Map Canvas - Left 8 columns: ALWAYS RENDERS */}
              <div className="lg:col-span-8 space-y-4">
                <GeospatialMapView
                  clusters={displayedClusters}
                  features={displayedFeatures}
                  selectedCluster={selectedCluster}
                  onSelectCluster={(cluster) => setSelectedCluster(cluster)}
                  searchedCoordinates={searchedCoordinates}
                  isHi={isHi}
                />
              </div>

              {/* Sidebar / Detail card or directory - Right 4 columns */}
              <div className="lg:col-span-4 space-y-4">
                {displayedClusters.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-semibold text-slate-200">
                        {isHi ? "क्षेत्र स्थिति: सुरक्षित" : "Area Status: Clear"}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {pincodeFilter
                          ? isHi
                            ? `पिन कोड ${pincodeFilter} के लिए कोई सक्रिय स्कैम रिपोर्ट दर्ज नहीं है।`
                            : `PIN code ${pincodeFilter} has zero recorded scam reports in the monitored window.`
                          : isHi
                          ? "वर्तमान में चुने गए मापदंडों के लिए कोई क्लस्टर नहीं मिला।"
                          : "No scam clusters recorded for the filtered criteria. You can explore the map freely or report suspicious activity."}
                      </p>
                    </div>
                    <div className="pt-2 flex flex-col gap-2">
                      <Link href="/report" className="w-full">
                        <PrimaryButton
                          variant="primary"
                          size="sm"
                          className="w-full"
                          leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}
                        >
                          {isHi ? t.home.reportIncident : "Report Incident"}
                        </PrimaryButton>
                      </Link>
                      {(pincodeFilter || cityFilter !== "ALL" || categoryFilter !== "ALL" || timeFilter !== 7) && (
                        <PrimaryButton
                          variant="secondary"
                          size="sm"
                          onClick={handleClearFilter}
                          className="w-full"
                        >
                          {t.map.clearFilters}
                        </PrimaryButton>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {selectedCluster ? (
                      <ClusterDetailCard
                        cluster={selectedCluster}
                        onClose={() => setSelectedCluster(null)}
                      />
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-center text-slate-400 space-y-2">
                        <MapPin className="w-6 h-6 mx-auto text-slate-500" />
                        <p className="text-sm font-semibold text-slate-300">
                          {t.map.selectArea}
                        </p>
                        <p className="text-xs text-slate-400">
                          {t.map.selectAreaDesc}
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
                  </>
                )}
              </div>
            </div>
          )}

          {viewMode === "map" && (
            <div className="space-y-4">
              <GeospatialMapView
                clusters={displayedClusters}
                features={displayedFeatures}
                selectedCluster={selectedCluster}
                onSelectCluster={(cluster) => setSelectedCluster(cluster)}
                searchedCoordinates={searchedCoordinates}
                isHi={isHi}
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
            displayedClusters.length === 0 ? (
              <EmptyState
                title={isHi ? "कोई स्कैम क्लस्टर नहीं मिला" : "No Scam Clusters Found"}
                description={
                  pincodeFilter || cityFilter !== "ALL" || categoryFilter !== "ALL"
                    ? isHi
                      ? `चुने गए समय और फ़िल्टर के लिए कोई स्कैम क्लस्टर दर्ज नहीं है। सभी क्षेत्र देखने के लिए फ़िल्टर साफ़ करें।`
                      : `No scam clusters recorded for the filtered criteria over the selected window. Try clearing filters to view all monitored areas.`
                    : isHi
                    ? `इस समय अंतराल में कोई स्कैम क्लस्टर रिपोर्ट नहीं हुआ। सतर्क रहें और संदिग्ध गतिविधियों की रिपोर्ट करें।`
                    : `No scam clusters reported across any monitored areas in this time window. Stay alert and report suspicious attempts.`
                }
                action={
                  <div className="flex items-center gap-3">
                    {(pincodeFilter || cityFilter !== "ALL" || categoryFilter !== "ALL" || timeFilter !== 7) && (
                      <PrimaryButton variant="secondary" size="sm" onClick={handleClearFilter}>
                        {t.map.clearFilters}
                      </PrimaryButton>
                    )}
                    <Link href="/report">
                      <PrimaryButton variant="primary" size="sm" leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}>
                        {isHi ? t.home.reportIncident : "Report Incident"}
                      </PrimaryButton>
                    </Link>
                  </div>
                }
              />
            ) : (
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
                        {isHi ? "एक क्लस्टर चुनें" : "Select a Cluster"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {isHi
                          ? "समूहीकृत मेट्रिक्स और पैटर्न देखने के लिए डायरेक्टरी से किसी भी क्षेत्र पर क्लिक करें।"
                          : "Click any item from the directory to review aggregated metrics and patterns."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* ── Help and Navigation Shortcuts ───────────────────────────── */}
      <div className="rounded-xl bg-slate-900/40 border border-slate-800 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-sm font-semibold text-slate-200">
            {isHi
              ? "क्या आपके क्षेत्र में कोई संदिग्ध कॉल या संदेश आए हैं?"
              : "Have you encountered suspicious calls or messages in your area?"}
          </h4>
          <p className="text-xs text-slate-400">
            {isHi
              ? "अज्ञात कॉल करने वालों, नकली KYC संदेशों या भुगतान धोखाधड़ी की रिपोर्ट करके अपने पड़ोस के नागरिकों को सतर्क रखें।"
              : "Help alert citizens in your neighborhood by reporting unknown callers, fake KYC messages, or payment scams."}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/lookup">
            <PrimaryButton
              variant="outline"
              size="sm"
              leftIcon={<Search className="w-3.5 h-3.5" />}
            >
              {isHi ? t.nav.lookup : "Lookup"}
            </PrimaryButton>
          </Link>
          <Link href="/report">
            <PrimaryButton
              variant="primary"
              size="sm"
              leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}
            >
              {isHi ? t.nav.report : "Report Scam"}
            </PrimaryButton>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ScamMapContainer;
