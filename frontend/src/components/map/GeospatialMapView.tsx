"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MapPin,
  Layers,
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
}

// Geographic bounding box for India (Lat 8.0 to 37.0, Lng 68.0 to 97.5)
const MIN_LNG = 68.0;
const MAX_LNG = 97.5;
const MIN_LAT = 8.0;
const MAX_LAT = 37.0;

const SVG_WIDTH = 800;
const SVG_HEIGHT = 700;

function projectCoords(lat: number, lng: number): { x: number; y: number } {
  // Clamp to bounds
  const clampedLng = Math.max(MIN_LNG, Math.min(MAX_LNG, lng));
  const clampedLat = Math.max(MIN_LAT, Math.min(MAX_LAT, lat));

  const x = ((clampedLng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * (SVG_WIDTH - 80) + 40;
  const y = ((MAX_LAT - clampedLat) / (MAX_LAT - MIN_LAT)) * (SVG_HEIGHT - 80) + 40;

  return { x, y };
}

// Major landmark cities for geographical context
const REGIONAL_REFERENCE_HUBS = [
  { name: "New Delhi", lat: 28.6139, lng: 77.209 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { name: "Lucknow", lat: 26.8467, lng: 80.9462 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Kochi", lat: 9.9312, lng: 76.2673 },
];

// Simplified outline path for India's mainland geometry
const INDIA_COASTLINE_PATH =
  "M 260 70 " + // North Kashmir
  "L 290 85 L 320 120 L 305 140 L 335 170 L 350 200 " + // Himachal / Uttarakhand
  "L 400 230 L 450 240 L 510 240 L 560 260 " + // Nepal border / Bihar
  "L 580 230 L 630 220 L 680 230 L 720 260 L 700 290 L 660 300 " + // Northeast / Assam / Arunachal
  "L 630 330 L 580 340 L 560 370 L 530 380 " + // Bengal coast
  "L 500 420 L 460 470 L 410 520 L 360 580 L 330 630 L 310 660 " + // East Coast down to Kanyakumari
  "L 280 660 L 260 630 L 250 580 L 240 520 L 210 470 L 170 420 " + // West Coast past Kerala, Goa, Mumbai
  "L 140 370 L 110 350 L 80 340 L 100 310 L 150 290 " + // Gujarat / Kutch / Kathiawar
  "L 170 250 L 200 210 L 220 160 L 235 120 Z"; // Rajasthan / Punjab to North

export function GeospatialMapView({
  clusters,
  selectedCluster,
  onSelectCluster,
  searchedCoordinates,
  className = "",
  isHi = false,
}: GeospatialMapViewProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredCluster, setHoveredCluster] = useState<MapClusterItem | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Pan to searched coordinates when available
  useEffect(() => {
    if (searchedCoordinates) {
      const timer = setTimeout(() => {
        const pt = projectCoords(searchedCoordinates[1], searchedCoordinates[0]);
        setZoom(2.2);
        setPan({
          x: (SVG_WIDTH / 2 - pt.x) * 2.2,
          y: (SVG_HEIGHT / 2 - pt.y) * 2.2,
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchedCoordinates]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.35, 3.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.35, 0.8));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Primary click only
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pan handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const getSeverityColors = useCallback((severity: string) => {
    const sev = severity?.toUpperCase();
    if (sev === "CRIT") {
      return {
        fill: "#ef4444",
        stroke: "#dc2626",
        bg: "rgba(239, 68, 68, 0.22)",
        glow: "rgba(239, 68, 68, 0.5)",
        pulse: "animate-ping",
      };
    }
    if (sev === "HIGH") {
      return {
        fill: "#f59e0b",
        stroke: "#d97706",
        bg: "rgba(245, 158, 11, 0.22)",
        glow: "rgba(245, 158, 11, 0.45)",
        pulse: "",
      };
    }
    // MED or default
    return {
      fill: "#14b8a6",
      stroke: "#0d9488",
      bg: "rgba(20, 184, 166, 0.22)",
      glow: "rgba(20, 184, 166, 0.4)",
      pulse: "",
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[520px] md:h-[620px] rounded-[2.5rem] border border-[#EAE6FD] bg-[#120D2C] overflow-hidden select-none shadow-xl shadow-[#6035E8]/10 ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
      role="application"
      aria-label="Interactive Scam Clusters Map of India"
    >
      {/* Background Geo Matrix Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#6035E8_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Map Control Buttons */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-white/95 border border-[#EAE6FD] rounded-2xl p-1.5 shadow-xl backdrop-blur-md">
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
        <div className="h-px bg-[#EAE6FD] my-0.5" />
        <button
          type="button"
          onClick={handleReset}
          className="p-2 rounded-xl text-[#171638] hover:text-[#6035E8] hover:bg-[#F0EDFF] active:bg-[#E0DCFC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6035E8] cursor-pointer"
          title={isHi ? "रीसेट करें" : "Reset View"}
          aria-label={isHi ? "रीसेट करें" : "Reset View"}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend */}
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
            ? "पिछले 7 दिनों की सत्यापित नागरिक रिपोर्टों से पिन कोड अनुसार समूहीकृत।"
            : "Aggregated by PIN code from community reports over the selected window."}
        </p>
      </div>

      {/* Coordinates / Zoom Level Info Pill */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-[#EAE6FD] text-[11px] font-mono text-[#171638] backdrop-blur-md shadow-sm">
        <span className="text-[#6035E8] font-bold">GIS Engine</span>
        <span className="text-[#DDD6FE]">•</span>
        <span className="font-medium text-[#545277]">Zoom: {zoom.toFixed(1)}x</span>
        <span className="text-[#DDD6FE]">•</span>
        <span className="font-bold text-[#08C9C5]">{clusters.length} clusters</span>
      </div>

      {/* SVG Canvas */}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.15s ease-out",
        }}
      >
        <defs>
          {/* Subtle gradient for map landmass */}
          <radialGradient id="landmassGradient" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#281A5E" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#191040" stopOpacity="0.85" />
          </radialGradient>

          {/* Radial glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Latitude / Longitude Reference Lines */}
        <g stroke="#2D1F6E" strokeWidth="1" strokeDasharray="3 3">
          {/* Latitude lines */}
          <line x1="20" y1="216" x2="780" y2="216" /> {/* ~28.5N */}
          <line x1="20" y1="416" x2="780" y2="416" /> {/* ~19.5N */}
          <line x1="20" y1="560" x2="780" y2="560" /> {/* ~13.0N */}
          {/* Longitude lines */}
          <line x1="260" y1="20" x2="260" y2="680" /> {/* ~77E */}
          <line x1="150" y1="20" x2="150" y2="680" /> {/* ~73E */}
          <line x1="540" y1="20" x2="540" y2="680" /> {/* ~88E */}
        </g>

        {/* India Continental Coastline & Territorial Polygon */}
        <path
          d={INDIA_COASTLINE_PATH}
          fill="url(#landmassGradient)"
          stroke="#4D2DBB"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="transition-colors"
        />

        {/* Regional Hub Labels for Geographical Anchor */}
        {REGIONAL_REFERENCE_HUBS.map((hub) => {
          const pt = projectCoords(hub.lat, hub.lng);
          return (
            <g key={hub.name} className="pointer-events-none opacity-45">
              <circle cx={pt.x} cy={pt.y} r="2.5" fill="#475569" />
              <text
                x={pt.x + 5}
                y={pt.y + 3}
                fontSize="9"
                fill="#64748b"
                fontFamily="monospace"
                letterSpacing="0.5px"
              >
                {hub.name}
              </text>
            </g>
          );
        })}

        {/* Cluster Markers */}
        {clusters.map((cluster) => {
          const pt = projectCoords(cluster.lat, cluster.lng);
          const isSelected =
            selectedCluster?.pincode === cluster.pincode &&
            selectedCluster?.locality === cluster.locality;
          const colors = getSeverityColors(cluster.severity);

          // Scaled size based on report count
          const baseRadius = Math.min(Math.max(12, 10 + cluster.count * 1.2), 26);

          return (
            <g
              key={`${cluster.pincode}-${cluster.locality}`}
              transform={`translate(${pt.x}, ${pt.y})`}
              className="cursor-pointer transition-transform duration-150 focus:outline-none"
              tabIndex={0}
              role="button"
              aria-label={`Scam cluster in ${cluster.locality}, ${cluster.city}. PIN ${cluster.pincode}. ${cluster.count} reports. Severity ${cluster.severity}.`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectCluster(cluster);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectCluster(cluster);
                }
              }}
              onMouseEnter={(e) => {
                setHoveredCluster(cluster);
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                  setHoverPos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }
              }}
              onMouseLeave={() => {
                setHoveredCluster(null);
                setHoverPos(null);
              }}
            >
              {/* Animated Ripple Pulse Ring for Critical and Selected items */}
              {(cluster.severity?.toUpperCase() === "CRIT" || isSelected) && (
                <circle
                  r={baseRadius + 14}
                  fill="none"
                  stroke={colors.fill}
                  strokeWidth="2"
                  opacity="0.6"
                  className="animate-ping origin-center"
                  style={{ animationDuration: "2.4s" }}
                />
              )}

              {/* Selection Halo Ring */}
              {isSelected && (
                <circle
                  r={baseRadius + 8}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  className="animate-spin"
                  style={{ animationDuration: "12s" }}
                />
              )}

              {/* Outer Glow Halo */}
              <circle
                r={baseRadius + 4}
                fill={colors.bg}
                stroke={colors.fill}
                strokeWidth="1.2"
                strokeOpacity="0.8"
                filter="url(#glow)"
              />

              {/* Core Solid Circle */}
              <circle
                r={baseRadius}
                fill="#0f172a"
                stroke={colors.fill}
                strokeWidth="2"
              />

              {/* Report Count inside marker */}
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={baseRadius > 16 ? "11" : "9.5"}
                fontWeight="bold"
                fill={colors.fill}
                fontFamily="monospace"
              >
                {cluster.count}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
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
    </div>
  );
}

export default GeospatialMapView;
