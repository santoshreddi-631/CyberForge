"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  MapPin,
  Layers,
  Globe2,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { MapClusterItem, MapGeoJsonFeature } from "@/lib/contracts";

export interface GeospatialMapViewProps {
  clusters: MapClusterItem[];
  features?: MapGeoJsonFeature[];
  selectedCluster: MapClusterItem | null;
  onSelectCluster: (cluster: MapClusterItem) => void;
  searchedCoordinates?: [number, number] | null;
  className?: string;
  isHi?: boolean;
  cityFilter?: string;
}

// Initial Map Settings — Default Center on Bengaluru, India
export const BENGALURU_CENTER: [number, number] = [77.5946, 12.9716];
export const DEFAULT_ZOOM = 11;
export const MIN_ZOOM = 3.5;
export const MAX_ZOOM = 18;

// Officially documented OpenFreeMap public vector map style
export const OPENFREEMAP_LIBERTY_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// Actual geographical coordinates for supported cities in India
const CITY_CENTERS: Record<string, [number, number]> = {
  Bengaluru: [77.5946, 12.9716],
  Mumbai: [72.8295, 19.0596],
  Delhi: [77.2001, 28.5494],
  Hyderabad: [78.3908, 17.4486],
  Chennai: [80.2565, 13.0012],
  Pune: [73.9143, 18.5679],
  Kolkata: [88.429, 22.579],
  Ahmedabad: [72.5085, 23.026],
  Jaipur: [75.808, 26.857],
  Lucknow: [80.999, 26.854],
  Kochi: [76.3419, 10.0159],
  Visakhapatnam: [83.3012, 17.7231],
  Vijayawada: [80.6276, 16.5103],
  Guntur: [80.4428, 16.3008],
  Vizianagaram: [83.3978, 18.1124],
};

interface ClusterGroup {
  items: MapClusterItem[];
  centerLng: number;
  centerLat: number;
  totalCount: number;
  highestSeverity: "LOW" | "MED" | "HIGH" | "CRIT";
}

export function GeospatialMapView({
  clusters,
  selectedCluster,
  onSelectCluster,
  searchedCoordinates,
  className = "",
  isHi = false,
  cityFilter,
}: GeospatialMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maplibreRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  const [mapReady, setMapReady] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);

  // Tooltip state for hovered markers
  const [hoveredCluster, setHoveredCluster] = useState<MapClusterItem | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<ClusterGroup | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const getSeverityColors = useCallback((severity?: string) => {
    const sev = severity?.toUpperCase();
    if (sev === "CRIT") {
      return {
        fill: "#ef4444",
        stroke: "#dc2626",
        bg: "rgba(239, 68, 68, 0.22)",
        glow: "rgba(239, 68, 68, 0.55)",
      };
    }
    if (sev === "HIGH") {
      return {
        fill: "#f59e0b",
        stroke: "#d97706",
        bg: "rgba(245, 158, 11, 0.22)",
        glow: "rgba(245, 158, 11, 0.45)",
      };
    }
    // MED or default
    return {
      fill: "#08C9C5",
      stroke: "#0d9488",
      bg: "rgba(8, 201, 197, 0.22)",
      glow: "rgba(8, 201, 197, 0.4)",
    };
  }, []);

  // Initialize MapLibre GL JS with OpenFreeMap vector tiles
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      try {
        setMapLoading(true);
        setMapError(null);

        const maplibre = await import("maplibre-gl");
        maplibreRef.current = maplibre;

        // Configure the static worker URL from public directory (avoids Turbopack chunking errors)
        if (typeof maplibre.setWorkerUrl === "function") {
          maplibre.setWorkerUrl("/maplibre-gl-worker.mjs");
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const MapClass = (maplibre as any).Map || (maplibre as any).default?.Map;

        if (!MapClass || isCancelled || !mapContainerRef.current) return;

        const map = new MapClass({
          container: mapContainerRef.current,
          style: OPENFREEMAP_LIBERTY_STYLE,
          center: BENGALURU_CENTER,
          zoom: DEFAULT_ZOOM,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
          attributionControl: false,
        });

        // Add built-in navigation control for compass
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const NavControl = (maplibre as any).default?.NavigationControl || (maplibre as any).NavigationControl;
        if (NavControl) {
          map.addControl(new NavControl({ showCompass: true, showZoom: false }), "bottom-right");
        }

        map.on("load", () => {
          if (!isCancelled) {
            mapInstanceRef.current = map;
            setMapReady(true);
            setMapLoading(false);
            setCurrentZoom(map.getZoom());
            map.resize();
          }
        });

        map.on("zoom", () => {
          if (!isCancelled) {
            setCurrentZoom(map.getZoom());
          }
        });

        map.on("error", () => {
          if (!isCancelled && !mapInstanceRef.current) {
            setMapError(
              isHi
                ? "नक्शा टाइल्स लोड करने में त्रुटि। कृपया इंटरनेट कनेक्शन जांचें।"
                : "Unable to load OpenFreeMap vector tiles. Please check your internet connection."
            );
            setMapLoading(false);
          }
        });
      } catch (err: unknown) {
        if (!isCancelled) {
          const message = err instanceof Error ? err.message : "Map initialization failed";
          setMapError(message);
          setMapLoading(false);
        }
      }
    }

    const timer = setTimeout(initMap, 0);

    // ResizeObserver ensures canvas fits responsively when layout changes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof window !== "undefined" && "ResizeObserver" in window && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.resize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, [isHi]);

  // Marker clustering algorithm: groups overlapping localities into clusters
  const renderMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    // Remove previous markers
    markersRef.current.forEach((marker) => {
      try {
        marker.remove();
      } catch {}
    });
    markersRef.current = [];

    const maplibre = maplibreRef.current;
    if (!maplibre) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const MarkerClass = (maplibre as any).Marker || (maplibre as any).default?.Marker;
    if (!MarkerClass) return;

    // Filter valid geographical coordinates
      const validClusters = clusters.filter(
        (c) => typeof c.lng === "number" && typeof c.lat === "number"
      );

      // Distance threshold in screen pixels to group overlapping markers
      const CLUSTER_THRESHOLD_PX = 46;

      interface ProjectedGroup {
        items: MapClusterItem[];
        centerLng: number;
        centerLat: number;
        screenX: number;
        screenY: number;
      }

      const groups: ProjectedGroup[] = [];

      validClusters.forEach((cluster) => {
        const pt = map.project([cluster.lng, cluster.lat]);

        let matched: ProjectedGroup | null = null;
        for (const g of groups) {
          const dx = g.screenX - pt.x;
          const dy = g.screenY - pt.y;
          if (Math.hypot(dx, dy) <= CLUSTER_THRESHOLD_PX) {
            matched = g;
            break;
          }
        }

        if (matched) {
          matched.items.push(cluster);
          const count = matched.items.length;
          matched.centerLng = (matched.centerLng * (count - 1) + cluster.lng) / count;
          matched.centerLat = (matched.centerLat * (count - 1) + cluster.lat) / count;
          matched.screenX = (matched.screenX * (count - 1) + pt.x) / count;
          matched.screenY = (matched.screenY * (count - 1) + pt.y) / count;
        } else {
          groups.push({
            items: [cluster],
            centerLng: cluster.lng,
            centerLat: cluster.lat,
            screenX: pt.x,
            screenY: pt.y,
          });
        }
      });

      // Render each group (Single item or Clustered multi-item)
      groups.forEach((group) => {
        const isCluster = group.items.length > 1;

        if (isCluster) {
          // --- Multi-Point Cluster Marker ---
          const totalReports = group.items.reduce((acc, i) => acc + (i.count || 0), 0);
          const hasCrit = group.items.some((i) => i.severity?.toUpperCase() === "CRIT");
          const hasHigh = group.items.some((i) => i.severity?.toUpperCase() === "HIGH");
          const highestSeverity: "LOW" | "MED" | "HIGH" | "CRIT" = hasCrit
            ? "CRIT"
            : hasHigh
            ? "HIGH"
            : "MED";

          const sevColors = getSeverityColors(highestSeverity);
          const clusterSummary: ClusterGroup = {
            items: group.items,
            centerLng: group.centerLng,
            centerLat: group.centerLat,
            totalCount: totalReports,
            highestSeverity,
          };

          const el = document.createElement("div");
          el.className = "group relative cursor-pointer focus:outline-none";
          el.setAttribute("role", "button");
          el.setAttribute(
            "aria-label",
            `Cluster of ${group.items.length} localities with ${totalReports} reports. Click to zoom in.`
          );

          el.innerHTML = `
            <div class="relative flex items-center justify-center">
              <div class="absolute -inset-1.5 rounded-full opacity-40 bg-[#6035E8] animate-pulse"></div>
              <div class="relative flex items-center gap-1 px-2.5 py-1 rounded-full border-2 shadow-xl transition-all duration-200 group-hover:scale-110 active:scale-95 bg-[#120D2C]"
                   style="border-color: ${sevColors.fill}; box-shadow: 0 0 16px ${sevColors.glow};">
                <span class="w-2 h-2 rounded-full" style="background-color: ${sevColors.fill};"></span>
                <span class="text-xs font-black font-mono text-white tracking-tight">${totalReports}</span>
                <span class="text-[10px] font-bold text-[#DDD6FE] pl-0.5">${group.items.length}</span>
              </div>
            </div>
          `;

          el.addEventListener("click", (e) => {
            e.stopPropagation();
            map.flyTo({
              center: [group.centerLng, group.centerLat],
              zoom: Math.min(map.getZoom() + 2.5, MAX_ZOOM),
              duration: 650,
              essential: true,
            });
          });

          el.addEventListener("mouseenter", (e) => {
            setHoveredGroup(clusterSummary);
            setHoveredCluster(null);
            const rect = mapContainerRef.current?.getBoundingClientRect();
            if (rect) {
              setHoverPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
              });
            }
          });

          el.addEventListener("mouseleave", () => {
            setHoveredGroup(null);
            setHoverPos(null);
          });

          const marker = new MarkerClass({ element: el })
            .setLngLat([group.centerLng, group.centerLat])
            .addTo(map);

          markersRef.current.push(marker);
        } else {
          // --- Single Locality Marker ---
          const cluster = group.items[0];
          const colors = getSeverityColors(cluster.severity);
          const isSelected =
            selectedCluster?.pincode === cluster.pincode &&
            selectedCluster?.locality === cluster.locality;

          const isCrit = cluster.severity?.toUpperCase() === "CRIT";
          const pingHtml =
            isCrit || isSelected
              ? `<div class="absolute -inset-2.5 rounded-full animate-ping opacity-60" style="background-color: ${colors.fill}; animation-duration: 2.2s;"></div>`
              : "";

          const selectHaloHtml = isSelected
            ? `<div class="absolute -inset-2 rounded-full border-2 border-sky-400 border-dashed animate-spin" style="animation-duration: 9s;"></div>`
            : "";

          // Locality label appears when zoomed in (zoom >= 10.5) or when selected
          const showLocalityLabel = currentZoom >= 10.5 || isSelected;
          const localityPillHtml = showLocalityLabel
            ? `<div class="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-[#120D2C]/90 border border-white/20 text-[10px] font-bold text-white shadow-md pointer-events-none backdrop-blur-sm">
                ${cluster.locality}
               </div>`
            : "";

          const el = document.createElement("div");
          el.className = "group relative cursor-pointer focus:outline-none";
          el.setAttribute("role", "button");
          el.setAttribute(
            "aria-label",
            `Cluster in ${cluster.locality}, ${cluster.city}. PIN ${cluster.pincode}. ${cluster.count} reports. Severity ${cluster.severity}.`
          );

          el.innerHTML = `
            <div class="relative flex flex-col items-center">
              ${pingHtml}
              ${selectHaloHtml}
              <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-lg transition-transform group-hover:scale-110 active:scale-95"
                   style="background-color: #120D2C; border-color: ${colors.fill}; box-shadow: 0 0 14px ${colors.glow};">
                <span class="text-[11px] font-black font-mono" style="color: ${colors.fill};">
                  ${cluster.count}
                </span>
              </div>
              ${localityPillHtml}
            </div>
          `;

          el.addEventListener("click", (e) => {
            e.stopPropagation();
            onSelectCluster(cluster);
          });

          el.addEventListener("mouseenter", (e) => {
            setHoveredCluster(cluster);
            setHoveredGroup(null);
            const rect = mapContainerRef.current?.getBoundingClientRect();
            if (rect) {
              setHoverPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
              });
            }
          });

          el.addEventListener("mouseleave", () => {
            setHoveredCluster(null);
            setHoverPos(null);
          });

          const marker = new MarkerClass({ element: el })
            .setLngLat([cluster.lng, cluster.lat])
            .addTo(map);

          markersRef.current.push(marker);
        }
      });
  }, [clusters, selectedCluster, onSelectCluster, mapReady, currentZoom, getSeverityColors]);

  // Re-render markers on clusters, selection, or zoom changes
  useEffect(() => {
    renderMarkers();
  }, [renderMarkers]);

  // Re-cluster when map moves or zooms
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    const handleMoveEnd = () => {
      renderMarkers();
    };

    map.on("moveend", handleMoveEnd);
    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [renderMarkers, mapReady]);

  // Smoothly fly to city when cityFilter is selected
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady || !cityFilter) return;

    if (cityFilter !== "ALL" && CITY_CENTERS[cityFilter]) {
      map.flyTo({
        center: CITY_CENTERS[cityFilter],
        zoom: 11.5,
        duration: 900,
        essential: true,
      });
    }
  }, [cityFilter, mapReady]);

  // Smoothly fly to searched coordinates (e.g. from pincode filter)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && mapReady && searchedCoordinates) {
      map.flyTo({
        center: searchedCoordinates,
        zoom: 13,
        duration: 1000,
        essential: true,
      });
    }
  }, [searchedCoordinates, mapReady]);

  // Center on selectedCluster if selected from external list
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && mapReady && selectedCluster) {
      if (typeof selectedCluster.lng === "number" && typeof selectedCluster.lat === "number") {
        map.easeTo({
          center: [selectedCluster.lng, selectedCluster.lat],
          duration: 700,
        });
      }
    }
  }, [selectedCluster, mapReady]);

  // Map Controls Handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current && mapReady) {
      mapInstanceRef.current.zoomIn({ duration: 250 });
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current && mapReady) {
      mapInstanceRef.current.zoomOut({ duration: 250 });
    }
  };

  const handleResetNorth = () => {
    if (mapInstanceRef.current && mapReady) {
      mapInstanceRef.current.resetNorthPitch({ duration: 400 });
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current && mapReady) {
      mapInstanceRef.current.flyTo({
        center: BENGALURU_CENTER,
        zoom: DEFAULT_ZOOM,
        pitch: 0,
        bearing: 0,
        duration: 800,
        essential: true,
      });
    }
  };

  const handleRetry = () => {
    setMapError(null);
    setMapLoading(true);
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch {}
      mapInstanceRef.current = null;
    }
    setMapReady(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[520px] md:h-[620px] rounded-[2.5rem] border border-[#EAE6FD] bg-[#120D2C] overflow-hidden select-none shadow-xl shadow-[#6035E8]/10 ${className}`}
      role="application"
      aria-label="Interactive Map of Scam Clusters"
    >
      {/* Real MapLibre WebGL Canvas Container */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Loading Indicator while Vector Tiles initialize */}
      {mapLoading && !mapError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#120D2C]/80 backdrop-blur-sm pointer-events-none transition-opacity duration-300">
          <Loader2 className="w-8 h-8 text-[#6035E8] animate-spin mb-3" />
          <p className="text-xs font-bold text-white tracking-wide">
            {isHi ? "ओपनफ़्रीमैप वेक्टर टाइल्स लोड हो रहा है..." : "Loading OpenFreeMap Vector Tiles..."}
          </p>
          <p className="text-[10px] text-[#DDD6FE] mt-1">
            {isHi ? "सड़कों और इलाकों का विवरण तैयार किया जा रहा है" : "Rendering streets, roads and localities"}
          </p>
        </div>
      )}

      {/* Error State if MapLibre fails */}
      {mapError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#120D2C] p-6 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
          <p className="text-sm font-bold text-white mb-1">
            {isHi ? "नक्शा लोड करने में असमर्थ" : "Geographical Map Unavailable"}
          </p>
          <p className="text-xs text-[#837FA8] max-w-sm mb-4">
            {mapError}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6035E8] text-white text-xs font-bold hover:bg-[#5028D0] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isHi ? "पुनः प्रयास करें" : "Retry Connection"}</span>
          </button>
        </div>
      )}

      {/* Map Control Floating Toolbar (Zoom in, Zoom out, North Reset, Reset View) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1 bg-white/95 border border-[#EAE6FD] rounded-2xl p-1.5 shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2 rounded-xl text-[#171638] hover:text-[#6035E8] hover:bg-[#F0EDFF] active:bg-[#E0DCFC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6035E8] cursor-pointer"
          title={isHi ? "ज़ूम इन" : "Zoom In"}
          aria-label={isHi ? "ज़ूम इन" : "Zoom In"}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2 rounded-xl text-[#171638] hover:text-[#6035E8] hover:bg-[#F0EDFF] active:bg-[#E0DCFC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6035E8] cursor-pointer"
          title={isHi ? "ज़ूम आउट" : "Zoom Out"}
          aria-label={isHi ? "ज़ूम आउट" : "Zoom Out"}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetNorth}
          className="p-2 rounded-xl text-[#171638] hover:text-[#6035E8] hover:bg-[#F0EDFF] active:bg-[#E0DCFC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6035E8] cursor-pointer"
          title={isHi ? "उत्तर दिशा संरेखित करें" : "Reset Bearing to North"}
          aria-label={isHi ? "उत्तर दिशा संरेखित करें" : "Reset Bearing to North"}
        >
          <Compass className="w-4 h-4" />
        </button>
        <div className="h-px bg-[#EAE6FD] my-0.5" />
        <button
          type="button"
          onClick={handleResetView}
          className="p-2 rounded-xl text-[#171638] hover:text-[#6035E8] hover:bg-[#F0EDFF] active:bg-[#E0DCFC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6035E8] cursor-pointer"
          title={isHi ? "बेंगलुरु पर रीसेट करें" : "Reset to Bengaluru Center"}
          aria-label={isHi ? "बेंगलुरु पर रीसेट करें" : "Reset to Bengaluru Center"}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Map Severity Legend */}
      <div className="absolute bottom-4 left-4 z-20 p-4 rounded-2xl bg-white/95 border border-[#EAE6FD] shadow-xl backdrop-blur-md text-xs text-[#171638] space-y-2 max-w-[240px]">
        <div className="flex items-center gap-1.5 font-bold text-[#171638]">
          <Layers className="w-3.5 h-3.5 text-[#6035E8]" />
          <span>{isHi ? "स्कैम गंभीरता स्तर" : "Scam Activity Severity"}</span>
        </div>
        <div className="space-y-1.5 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]" />
            <span className="text-[#545277]">
              {isHi ? "CRIT (अत्यधिक जोखिम)" : "CRIT (Critical Volume)"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
            <span className="text-[#545277]">
              {isHi ? "HIGH (उच्च जोखिम)" : "HIGH (Elevated Volume)"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#08C9C5] shadow-[0_0_8px_#08C9C5]" />
            <span className="text-[#545277]">
              {isHi ? "MED (मध्यम स्तर)" : "MED (Moderate Volume)"}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-[#837FA8] border-t border-[#EAE6FD] pt-1.5 leading-tight font-medium">
          {isHi
            ? "सत्यापित नागरिक रिपोर्टों से पिन कोड अनुसार समूहीकृत।"
            : "Aggregated by PIN code from community reports over the selected window."}
        </p>
      </div>

      {/* Header Info & Attribution Pill */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-[#EAE6FD] text-[11px] font-mono text-[#171638] backdrop-blur-md shadow-sm max-w-[calc(100%-80px)]">
        <div className="flex items-center gap-1.5 text-[#6035E8] font-bold">
          <Globe2 className="w-3.5 h-3.5" />
          <span>OpenFreeMap Vector GL</span>
        </div>
        <span className="text-[#DDD6FE]">•</span>
        <span className="font-bold text-[#08C9C5]">{clusters.length} active areas</span>
        <span className="text-[#DDD6FE]">•</span>
        <span className="text-[10px] text-[#837FA8] font-sans">
          © OpenFreeMap • © OpenStreetMap contributors
        </span>
      </div>

      {/* Floating Hover Tooltip for Individual Cluster */}
      {hoveredCluster && hoverPos && (
        <div
          className="absolute z-30 pointer-events-none p-3.5 rounded-2xl bg-white/95 border border-[#EAE6FD] shadow-2xl backdrop-blur-md text-xs space-y-1 transform -translate-x-1/2 -translate-y-full mb-3"
          style={{
            left: `${hoverPos.x}px`,
            top: `${hoverPos.y - 12}px`,
          }}
        >
          <div className="flex items-center gap-1.5 font-bold text-[#171638]">
            <MapPin className="w-3.5 h-3.5 text-[#6035E8]" />
            <span>{hoveredCluster.locality}</span>
          </div>
          <p className="text-[11px] text-[#545277] font-medium">
            {hoveredCluster.city} ({hoveredCluster.pincode})
          </p>
          <div className="flex items-center gap-2 pt-1.5 border-t border-[#EAE6FD] text-[11px]">
            <span className="font-mono font-black text-[#08C9C5]">
              {hoveredCluster.count} {isHi ? "रिपोर्ट्स" : "reports"}
            </span>
            <span className="text-[#DDD6FE]">•</span>
            <span
              className={`font-bold ${
                hoveredCluster.severity === "CRIT"
                  ? "text-rose-600"
                  : hoveredCluster.severity === "HIGH"
                  ? "text-amber-600"
                  : "text-[#08C9C5]"
              }`}
            >
              {hoveredCluster.severity}
            </span>
          </div>
        </div>
      )}

      {/* Floating Hover Tooltip for Grouped Cluster */}
      {hoveredGroup && hoverPos && (
        <div
          className="absolute z-30 pointer-events-none p-3.5 rounded-2xl bg-white/95 border border-[#EAE6FD] shadow-2xl backdrop-blur-md text-xs space-y-1.5 transform -translate-x-1/2 -translate-y-full mb-3 max-w-[220px]"
          style={{
            left: `${hoverPos.x}px`,
            top: `${hoverPos.y - 12}px`,
          }}
        >
          <div className="flex items-center justify-between gap-2 font-bold text-[#171638]">
            <div className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#6035E8]" />
              <span>{isHi ? "क्लस्टर समूह" : "Combined Cluster"}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F0EDFF] text-[#6035E8] font-bold">
              {hoveredGroup.items.length} {isHi ? "क्षेत्र" : "areas"}
            </span>
          </div>
          <div className="text-[11px] text-[#545277] font-medium line-clamp-2">
            {hoveredGroup.items.map((i) => i.locality).join(", ")}
          </div>
          <div className="flex items-center gap-2 pt-1.5 border-t border-[#EAE6FD] text-[11px]">
            <span className="font-mono font-black text-[#08C9C5]">
              {hoveredGroup.totalCount} {isHi ? "कुल रिपोर्ट्स" : "total reports"}
            </span>
            <span className="text-[#DDD6FE]">•</span>
            <span className="text-[10px] text-[#837FA8]">
              {isHi ? "ज़ूम के लिए क्लिक करें" : "Click to expand"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default GeospatialMapView;
