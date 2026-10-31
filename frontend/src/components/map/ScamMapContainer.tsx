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
} from "lucide-react";
import { apiClient, ApiError } from "@/lib/api/client";
import {
  MapClusterItem,
  MapResponseContract,
  MapGeoJsonFeature,
} from "@/lib/contracts";
import { MONITORED_AREAS } from "@/lib/constants/reportOptions";
import { ErrorState } from "@/components/ui/ErrorState";
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
    const timer = setTimeout(() => {
      fetchMapData({ days: timeFilter, category: categoryFilter, pincode: pincodeFilter });
    }, 0);

    return () => {
      clearTimeout(timer);
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
      <div className="rounded-2xl bg-white border border-[#EAE6FD] p-5 text-xs text-[#545277] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-full bg-[#6035E8]/10 text-[#6035E8] flex items-center justify-center shrink-0 mt-0.5">
            <EyeOff className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <span className="font-bold text-[#171638] text-sm block">
              {isHi ? "गोपनीयता और सुरक्षित मानचित्रण मानक" : "Privacy and Safe Mapping Standard"}
            </span>
            <p className="text-[#837FA8] leading-relaxed text-xs">
              {isHi
                ? `यह मानचित्र पिछले ${timeFilter === 1 ? "24 घंटों" : `${timeFilter} दिनों`} की समूहीकृत रिपोर्ट प्रदर्शित करता है। व्यक्तिगत जीपीएस निर्देशांक, पते या फ़ोन नंबर कभी उजागर नहीं किए जाते।`
                : `This map displays aggregated community reports over the last ${
                    timeFilter === 1 ? "24 hours" : `${timeFilter} days`
                  }. Exact reporter GPS coordinates, residential addresses, and personal identities are never exposed.`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#F0EDFF] text-[#6035E8] border border-[#DDD6FE] flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#6035E8]" />
            {isHi ? "7-दिवसीय मानक" : "7-Day Standard"}
          </span>
        </div>
      </div>

      {/* ── Controls Toolbar ────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-[#EAE6FD] p-4 sm:p-5 space-y-3 shadow-sm">
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
                className="w-full h-11 px-3 pr-8 rounded-xl bg-[#F6F4FE] border border-[#EAE6FD] hover:border-[#6035E8]/40 focus:border-[#6035E8] focus:bg-white text-xs text-[#171638] outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="ALL">{t.map.allCities}</option>
                {availableCities.map((city) => (
                  <option key={city} value={city} className="bg-white text-[#171638]">
                    {city}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#837FA8] pointer-events-none" />
            </div>

            {/* Pincode search input */}
            <div className="relative flex-1 sm:max-w-xs">
              <input
                type="text"
                inputMode="numeric"
                value={pincodeFilter}
                onChange={(e) => setPincodeFilter(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={isHi ? "6-अंकों के पिन कोड द्वारा खोजें..." : "Filter by 6-digit PIN code..."}
                className="w-full h-11 px-3 pl-9 rounded-xl bg-[#F6F4FE] border border-[#EAE6FD] hover:border-[#6035E8]/40 focus:border-[#6035E8] focus:bg-white text-xs text-[#171638] placeholder:text-[#837FA8] outline-none transition-colors font-mono"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#837FA8] pointer-events-none" />
            </div>

            <PrimaryButton
              type="submit"
              variant="purple"
              size="sm"
              className="text-xs h-11"
            >
              {t.map.filterPin}
            </PrimaryButton>

            {(pincodeFilter ||
              cityFilter !== "ALL" ||
              categoryFilter !== "ALL" ||
              timeFilter !== 7) && (
              <button
                type="button"
                onClick={handleClearFilter}
                className="text-xs text-[#6035E8] hover:text-[#4317BD] font-bold underline underline-offset-4 px-2 cursor-pointer"
              >
                {t.map.clearFilters}
              </button>
            )}
          </form>

          {/* View mode toggle (Map / List / Split) */}
          <div className="flex items-center gap-1 bg-[#F0EDFF] p-1.5 rounded-full border border-[#EAE6FD] shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                viewMode === "map"
                  ? "bg-[#6035E8] text-white font-bold shadow-sm"
                  : "text-[#545277] hover:text-[#171638]"
              }`}
            >
              {t.map.mapOnly}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`hidden lg:block px-3 py-1.5 rounded-full text-xs transition-all ${
                viewMode === "split"
                  ? "bg-[#6035E8] text-white font-bold shadow-sm"
                  : "text-[#545277] hover:text-[#171638]"
              }`}
            >
              {t.map.splitView}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                viewMode === "list"
                  ? "bg-[#6035E8] text-white font-bold shadow-sm"
                  : "text-[#545277] hover:text-[#171638]"
              }`}
            >
              {t.map.directory}
            </button>
            <button
              type="button"
              disabled={isRefreshing}
              onClick={() =>
                fetchMapData({
                  days: timeFilter,
                  category: categoryFilter,
                  pincode: pincodeFilter,
                })
              }
              className={`p-1.5 rounded-full text-[#545277] hover:text-[#171638] hover:bg-white/80 transition-colors ml-1 cursor-pointer ${
                isRefreshing ? "animate-spin text-[#6035E8]" : ""
              }`}
              title={
                isHi
                  ? `डेटा रीफ्रेश करें${formattedLastUpdated ? ` (अंतिम: ${formattedLastUpdated})` : ""}`
                  : `Refresh map data${formattedLastUpdated ? ` (Last: ${formattedLastUpdated})` : ""}`
              }
              aria-label={
                isHi
                  ? `डेटा रीफ्रेश करें${formattedLastUpdated ? ` (अंतिम: ${formattedLastUpdated})` : ""}`
                  : `Refresh map data${formattedLastUpdated ? ` (Last: ${formattedLastUpdated})` : ""}`
              }
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Metrics ─────────────────────────────────────────── */}
      {summaryMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#EAE6FD] space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-[#837FA8] uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-[#6035E8]" />
              <span>{t.map.activeClusters}</span>
            </div>
            <p className="text-3xl font-black font-mono text-[#171638]">
              {summaryMetrics.activeClusters}
            </p>
            <p className="text-[11px] text-[#837FA8] font-medium">
              {isHi ? "निगरानी किए जा रहे क्षेत्र" : "monitored localities"}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EAE6FD] space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-[#837FA8] uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-[#08C9C5]" />
              <span>{t.map.reports7Days}</span>
            </div>
            <p className="text-3xl font-black font-mono text-[#08C9C5]">
              {summaryMetrics.totalReports}
            </p>
            <p className="text-[11px] text-[#837FA8] font-medium">
              {isHi ? "सत्यापित नागरिक रिपोर्टें" : "verified community reports"}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EAE6FD] space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-[#837FA8] uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>{t.map.criticalHotspots}</span>
            </div>
            <p className="text-3xl font-black font-mono text-rose-600">
              {summaryMetrics.criticalHotspots}
            </p>
            <p className="text-[11px] text-[#837FA8] font-medium">
              {isHi ? "गंभीर (CRIT) क्षेत्र" : "CRIT severity areas"}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EAE6FD] space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-[#837FA8] uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-[#FFC928]" />
              <span>{t.map.dominantPattern}</span>
            </div>
            <p className="text-base font-black text-[#171638] truncate mt-1">
              {summaryMetrics.dominantPattern}
            </p>
            <p className="text-[11px] text-[#837FA8] font-medium">
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
                {selectedCluster ? (
                  <ClusterDetailCard
                    cluster={selectedCluster}
                    onClose={() => setSelectedCluster(null)}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#DDD6FE] bg-white p-6 text-center text-[#545277] space-y-2 shadow-sm">
                    <MapPin className="w-6 h-6 mx-auto text-[#6035E8]" />
                    <p className="text-sm font-bold text-[#171638]">
                      {t.map.selectArea}
                    </p>
                    <p className="text-xs text-[#837FA8]">
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
                  <div className="rounded-2xl border border-dashed border-[#DDD6FE] bg-white p-8 text-center text-[#545277] space-y-2 shadow-sm">
                    <MapPin className="w-6 h-6 mx-auto text-[#6035E8]" />
                    <p className="text-sm font-bold text-[#171638]">
                      {isHi ? "एक क्लस्टर चुनें" : "Select a Cluster"}
                    </p>
                    <p className="text-xs text-[#837FA8]">
                      {isHi
                        ? "समूहीकृत मेट्रिक्स और पैटर्न देखने के लिए डायरेक्टरी से किसी भी क्षेत्र पर क्लिक करें।"
                        : "Click any item from the directory to review aggregated metrics and patterns."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Help and Navigation Shortcuts ───────────────────────────── */}
      <div className="rounded-[2rem] bg-white border border-[#EAE6FD] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1.5 text-center sm:text-left">
          <h4 className="text-base sm:text-lg font-black text-[#171638] tracking-tight">
            {isHi
              ? "क्या आपके क्षेत्र में कोई संदिग्ध कॉल या संदेश आए हैं?"
              : "Have you encountered suspicious calls or messages in your area?"}
          </h4>
          <p className="text-xs sm:text-sm text-[#545277] font-medium max-w-xl leading-relaxed">
            {isHi
              ? "अज्ञात कॉल करने वालों, नकली KYC संदेशों या भुगतान धोखाधड़ी की रिपोर्ट करके अपने पड़ोस के नागरिकों को सतर्क रखें।"
              : "Help alert citizens in your neighborhood by reporting unknown callers, fake KYC messages, or payment scams."}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
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
