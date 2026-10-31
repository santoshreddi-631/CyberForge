"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Flame,
  MapPin,
  ShieldCheck,
  Radio,
  Globe2,
  Navigation,
} from "lucide-react";
import { MapClusterItem, MapGeoJsonFeature } from "@/lib/contracts";
import { getScamTypeLabel } from "./ClusterDetailCard";
import "maplibre-gl/dist/maplibre-gl.css";

export type BasemapProvider = "openfreemap" | "maptiler" | "esri";

export interface GeospatialMapViewProps {
  clusters: MapClusterItem[];
  features?: MapGeoJsonFeature[];
  selectedCluster: MapClusterItem | null;
  onSelectCluster: (cluster: MapClusterItem) => void;
  searchedCoordinates?: [number, number] | null;
  className?: string;
  isHi?: boolean;
}

const INDIA_CENTER: [number, number] = [78.9629, 20.5937];
const DEFAULT_ZOOM = 4.3;

// Verified target locations for geographic evaluation
export const TEST_LOCATIONS = [
  { name: "New Delhi", center: [77.209, 28.6139] as [number, number], zoom: 11, label: "New Delhi (Capital)" },
  { name: "Bengaluru", center: [77.5946, 12.9716] as [number, number], zoom: 11, label: "Bengaluru (Karnataka)" },
  { name: "Hyderabad", center: [78.4867, 17.385] as [number, number], zoom: 11, label: "Hyderabad (Telangana)" },
  { name: "Visakhapatnam", center: [83.2185, 17.6868] as [number, number], zoom: 11, label: "Visakhapatnam (AP)" },
  { name: "Vijayawada", center: [80.648, 16.5062] as [number, number], zoom: 11, label: "Vijayawada (AP)" },
  { name: "Guntur", center: [80.4365, 16.3067] as [number, number], zoom: 11, label: "Guntur (AP)" },
];

/**
 * Dynamically fetches and enhances OpenFreeMap Liberty style to ensure
 * robust label visibility, Indian multilingual fallback, and high-contrast
 * styling against dark cybersecurity UI.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getEnhancedOpenFreeMapStyle(isHi: boolean): Promise<any> {
  const res = await fetch("https://tiles.openfreemap.org/styles/liberty");
  if (!res.ok) {
    throw new Error(`Failed to load OpenFreeMap style: ${res.statusText}`);
  }
  const style = await res.json();

  // Prefer English label when available, with Hindi/local as appropriate
  const preferredTextField = isHi
    ? [
        "coalesce",
        ["get", "name:hi"],
        ["get", "name:en"],
        ["get", "name_en"],
        ["get", "name:latin"],
        ["get", "name"],
      ]
    : [
        "coalesce",
        ["get", "name:en"],
        ["get", "name_en"],
        ["get", "name:latin"],
        ["get", "name"],
      ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style.layers = style.layers.map((layer: any) => {
    // 1. Place Symbol Layers (Cities, Towns, Villages, Suburbs/Localities)
    if (layer["source-layer"] === "place") {
      const updated = { ...layer };
      if (updated.layout) {
        updated.layout = {
          ...updated.layout,
          // CRITICAL: Prevent text suppression when sprite icons collide or fail
          "icon-optional": true,
          "text-field": preferredTextField,
          "text-max-width": 9,
          "text-letter-spacing": 0.05,
        };
      }

      // Lower minzoom so towns (like Guntur, Vijayawada) appear at state overview zoom (4.5)
      if (updated.id === "label_town") {
        updated.minzoom = 4.5;
      }

      // Suburbs / Localities (HSR Layout, Madhapur, Connaught Place) appear starting at zoom 7.5
      if (updated.id === "label_other" || updated.id === "label_village") {
        updated.minzoom = 7.5;
      }

      // High-contrast typography for dark UI readability
      if (updated.paint && updated.paint["text-color"]) {
        updated.paint = {
          ...updated.paint,
          "text-color": updated.id.includes("capital") ? "#ffffff" : "#f8fafc",
          "text-halo-color": "#020617",
          "text-halo-width": 2.5,
          "text-halo-blur": 1,
        };
      }
      return updated;
    }

    // 2. State & Province Labels
    if (layer.id === "label_state") {
      const updated = { ...layer, minzoom: 4, maxzoom: 10 };
      if (updated.layout) {
        updated.layout = { ...updated.layout, "text-field": preferredTextField };
      }
      if (updated.paint) {
        updated.paint = {
          ...updated.paint,
          "text-color": "#cbd5e1",
          "text-halo-color": "#020617",
          "text-halo-width": 2,
        };
      }
      return updated;
    }

    // 3. Major Road & Highway Names (e.g. NH16 connecting Vijayawada & Guntur, NH44)
    if (layer["source-layer"] === "transportation_name") {
      if (layer.id === "highway-name-major") {
        const updated = { ...layer, minzoom: 8.5 };
        if (updated.layout) {
          updated.layout = { ...updated.layout, "text-field": preferredTextField };
        }
        if (updated.paint) {
          updated.paint = {
            ...updated.paint,
            "text-color": "#94a3b8",
            "text-halo-color": "#020617",
            "text-halo-width": 2,
          };
        }
        return updated;
      }
    }

    return layer;
  });

  return style;
}

export function GeospatialMapView({
  clusters,
  features,
  selectedCluster,
  onSelectCluster,
  searchedCoordinates = null,
  className = "",
  isHi = false,
}: GeospatialMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const popupRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Basemap provider state (Auto-select MapTiler if API key exists, otherwise OpenFreeMap)
  const defaultProvider: BasemapProvider = process.env.NEXT_PUBLIC_MAPTILER_API_KEY
    ? "maptiler"
    : process.env.NEXT_PUBLIC_ESRI_API_KEY
    ? "esri"
    : "openfreemap";

  const [activeProvider, setActiveProvider] = useState<BasemapProvider>(defaultProvider);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);

  // Layer toggles (all active by default)
  const [showMarkers, setShowMarkers] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showClusters, setShowClusters] = useState(true);

  // Build GeoJSON FeatureCollection from features or clusters
  const geojsonData = useMemo(() => {
    if (features && features.length > 0) {
      return {
        type: "FeatureCollection" as const,
        features: features.map((f) => ({
          type: "Feature" as const,
          geometry: f.geometry,
          properties: {
            pincode: f.properties.pincode,
            area: f.properties.area || f.properties.locality,
            locality: f.properties.locality || f.properties.area,
            city: f.properties.city,
            report_count: Number(f.properties.report_count) || 1,
            dominant_category:
              f.properties.dominant_category || f.properties.top_scam_type,
            top_scam_type:
              f.properties.top_scam_type || f.properties.dominant_category,
            risk_level:
              f.properties.risk_level || f.properties.severity || "MED",
            severity:
              f.properties.severity || f.properties.risk_level || "MED",
          },
        })),
      };
    }

    return {
      type: "FeatureCollection" as const,
      features: clusters.map((c) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [c.lng, c.lat] as [number, number],
        },
        properties: {
          pincode: c.pincode,
          area: c.locality,
          locality: c.locality,
          city: c.city,
          report_count: Number(c.count) || 1,
          dominant_category: c.top_scam_type,
          top_scam_type: c.top_scam_type,
          risk_level: c.severity,
          severity: c.severity,
        },
      })),
    };
  }, [clusters, features]);

  // Create Popup HTML string
  const createPopupContent = useCallback(
    (item: MapClusterItem) => {
      const scamLabel = getScamTypeLabel(item.top_scam_type, isHi);
      const sev = item.severity?.toUpperCase() || "MED";
      const sevColor =
        sev === "CRIT" ? "#f43f5e" : sev === "HIGH" ? "#f59e0b" : "#14b8a6";
      const sevBg =
        sev === "CRIT"
          ? "rgba(244, 63, 94, 0.15)"
          : sev === "HIGH"
          ? "rgba(245, 158, 11, 0.15)"
          : "rgba(20, 184, 166, 0.15)";
      const sevBorder =
        sev === "CRIT"
          ? "rgba(244, 63, 94, 0.4)"
          : sev === "HIGH"
          ? "rgba(245, 158, 11, 0.4)"
          : "rgba(20, 184, 166, 0.4)";

      return `
        <div style="font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; border: 1px solid #334155; border-radius: 12px; padding: 14px; min-width: 220px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6);">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
            <div style="font-size: 14px; font-weight: 700; color: #f8fafc;">${item.locality}</div>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 9999px; background: ${sevBg}; color: ${sevColor}; border: 1px solid ${sevBorder};">
              ${sev} RISK
            </span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 10px; font-family: monospace;">
            ${item.city} • PIN ${item.pincode}
          </div>
          <div style="background: #1e293b; border-radius: 8px; padding: 8px 10px; margin-bottom: 10px;">
            <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
              ${isHi ? "प्राथमिक धोखाधड़ी पैटर्न" : "Dominant Scam Pattern"}
            </div>
            <div style="font-size: 12px; font-weight: 600; color: #38bdf8;">
              ${scamLabel}
            </div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin-bottom: 8px;">
            <span style="color: #94a3b8;">${isHi ? "नागरिक रिपोर्टें:" : "Community Reports:"}</span>
            <span style="font-weight: 700; color: #2dd4bf; font-family: monospace; font-size: 13px;">${item.count}</span>
          </div>
          <div style="border-top: 1px dashed #334155; padding-top: 8px; margin-top: 6px; font-size: 9.5px; color: #64748b; line-height: 1.35;">
            🛡️ ${isHi ? "क्षेत्रीय स्तर पर समूहीकृत। व्यक्तिगत जीपीएस या पहचान सुरक्षित रखी जाती है।" : "Aggregated area centroid. No reporter GPS or identity exposed."}
          </div>
        </div>
      `;
    },
    [isHi]
  );

  /**
   * Adds community scam sources and visualization layers to the MapLibre instance.
   * Crucially places the scam heatmap underneath the basemap's text labels
   * so city, town, district, and road names remain razor-sharp and visible.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attachScamDataLayers = useCallback((mapInstance: any, data: any) => {
    if (!mapInstance || !mapInstance.isStyleLoaded()) return;

    // Remove existing scam layers and sources if present before re-adding
    const layerIds = [
      "unclustered-label",
      "unclustered-point",
      "cluster-label",
      "cluster-count",
      "clusters",
      "scam-heatmap",
    ];

    for (const id of layerIds) {
      if (mapInstance.getLayer(id)) {
        mapInstance.removeLayer(id);
      }
    }

    if (mapInstance.getSource("scam-cluster-source")) {
      mapInstance.removeSource("scam-cluster-source");
    }
    if (mapInstance.getSource("scam-heatmap-source")) {
      mapInstance.removeSource("scam-heatmap-source");
    }

    // Determine the first symbol (label) layer in the basemap style
    const styleLayers = mapInstance.getStyle().layers || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstSymbolLayer = styleLayers.find((l: any) => l.type === "symbol");
    const beforeLabelId = firstSymbolLayer ? firstSymbolLayer.id : undefined;

    // 1. Heatmap Source (unclustered for smooth continuous density)
    mapInstance.addSource("scam-heatmap-source", {
      type: "geojson",
      data,
    });

    // 2. Clusters Source (with clustering enabled)
    mapInstance.addSource("scam-cluster-source", {
      type: "geojson",
      data,
      cluster: true,
      clusterMaxZoom: 12,
      clusterRadius: 50,
    });

    // Layer A: Continuous Density Heatmap (Placed BEFORE labels so labels are visible on top)
    mapInstance.addLayer(
      {
        id: "scam-heatmap",
        type: "heatmap",
        source: "scam-heatmap-source",
        maxzoom: 14,
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "report_count"],
            1,
            0.3,
            5,
            0.7,
            20,
            1.0,
          ],
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1,
            9,
            3,
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0, 0, 0, 0)",
            0.2,
            "rgba(20, 184, 166, 0.4)",
            0.4,
            "rgba(14, 165, 233, 0.7)",
            0.6,
            "rgba(245, 158, 11, 0.85)",
            0.8,
            "rgba(244, 63, 94, 0.9)",
            1,
            "rgba(239, 68, 68, 1)",
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            16,
            9,
            36,
          ],
          "heatmap-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7,
            0.8,
            13,
            0.3,
          ],
        },
      },
      beforeLabelId
    );

    // Layer B: Clustered Circles (High-contrast community groupings)
    mapInstance.addLayer({
      id: "clusters",
      type: "circle",
      source: "scam-cluster-source",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#0d9488", // teal (<5)
          5,
          "#d97706", // amber (5-19)
          20,
          "#e11d48", // rose (>=20)
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          18,
          5,
          24,
          20,
          32,
        ],
        "circle-stroke-width": 2.5,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-opacity": 0.9,
      },
    });

    // Layer C: Cluster Count Numbers (Uses Noto Sans Bold)
    mapInstance.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "scam-cluster-source",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["Noto Sans Bold"],
        "text-size": 13,
      },
      paint: {
        "text-color": "#ffffff",
      },
    });

    // Layer D: Cluster Sub-title Label ("X Reports")
    mapInstance.addLayer({
      id: "cluster-label",
      type: "symbol",
      source: "scam-cluster-source",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count} Reports",
        "text-font": ["Noto Sans Bold"],
        "text-size": 11,
        "text-offset": [0, 1.8],
        "text-anchor": "top",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#5eead4",
        "text-halo-color": "#020617",
        "text-halo-width": 2.5,
        "text-halo-blur": 1,
      },
    });

    // Layer E: Unclustered Individual Aggregate Circles
    mapInstance.addLayer({
      id: "unclustered-point",
      type: "circle",
      source: "scam-cluster-source",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": [
          "match",
          ["get", "severity"],
          "CRIT",
          "#f43f5e",
          "HIGH",
          "#f59e0b",
          "MED",
          "#14b8a6",
          "#38bdf8",
        ],
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "report_count"],
          1,
          9,
          10,
          14,
          50,
          20,
        ],
        "circle-stroke-width": 2.5,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-opacity": 0.95,
      },
    });

    // Layer F: Unclustered Area & Locality NAMES (Distinct and sharp)
    mapInstance.addLayer({
      id: "unclustered-label",
      type: "symbol",
      source: "scam-cluster-source",
      filter: ["!", ["has", "point_count"]],
      layout: {
        "text-field": [
          "format",
          ["get", "locality"],
          {
            "font-scale": 1.05,
            "text-font": ["literal", ["Noto Sans Bold"]],
          },
          "\n",
          {},
          [
            "concat",
            ["get", "city"],
            " • ",
            ["to-string", ["get", "report_count"]],
            " reports",
          ],
          {
            "font-scale": 0.82,
            "text-font": ["literal", ["Noto Sans Regular"]],
          },
        ],
        "text-font": ["Noto Sans Bold"],
        "text-size": 13,
        "text-offset": [0, 1.3],
        "text-anchor": "top",
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "#020617",
        "text-halo-width": 3,
        "text-halo-blur": 1.5,
      },
    });
  }, []);

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isCancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mapInstance: any = null;

    async function initMap() {
      try {
        const maplibreModule = await import("maplibre-gl");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const maplibregl: any = (maplibreModule as any).default || maplibreModule;

        if (isCancelled || !mapContainerRef.current) return;

        // Resolve style definition based on chosen provider and credentials
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let styleDefinition: any;
        const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
        const esriKey = process.env.NEXT_PUBLIC_ESRI_API_KEY;

        if (activeProvider === "maptiler" && maptilerKey) {
          styleDefinition = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${maptilerKey}`;
        } else if (activeProvider === "esri" && esriKey) {
          styleDefinition = `https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/arcgis/navigation?token=${esriKey}`;
        } else if (activeProvider === "esri") {
          styleDefinition = "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/resources/styles/root.json";
        } else {
          // OpenFreeMap Enhanced with full label tuning
          styleDefinition = await getEnhancedOpenFreeMapStyle(isHi);
        }

        if (isCancelled || !mapContainerRef.current) return;

        mapInstance = new maplibregl.Map({
          container: mapContainerRef.current,
          style: styleDefinition,
          center: INDIA_CENTER,
          zoom: DEFAULT_ZOOM,
          minZoom: 3,
          maxZoom: 18,
          attributionControl: false,
        });

        // Add attribution & navigation controls
        const attribution = activeProvider === "maptiler"
          ? "© MapTiler | © OpenStreetMap contributors"
          : activeProvider === "esri"
          ? "© Esri | © OpenStreetMap contributors"
          : "© OpenFreeMap | © OpenStreetMap contributors";

        mapInstance.addControl(
          new maplibregl.AttributionControl({
            compact: true,
            customAttribution: attribution,
          }),
          "bottom-right"
        );

        mapInstance.addControl(
          new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: false,
          }),
          "top-right"
        );

        mapInstance.on("load", () => {
          if (isCancelled) return;

          // Attach our custom scam layers underneath the label layers
          attachScamDataLayers(mapInstance, geojsonData);

          // Interactions: Cluster Click -> Zoom in
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mapInstance.on("click", "clusters", async (e: any) => {
            const featuresAtPoint = mapInstance.queryRenderedFeatures(e.point, {
              layers: ["clusters"],
            });
            if (!featuresAtPoint.length) return;
            const clusterId = featuresAtPoint[0].properties?.cluster_id;
            const source = mapInstance.getSource("scam-cluster-source");
            if (clusterId !== undefined && source?.getClusterExpansionZoom) {
              try {
                const zoom = await source.getClusterExpansionZoom(clusterId);
                const geom = featuresAtPoint[0].geometry;
                if (geom.type === "Point") {
                  mapInstance.easeTo({
                    center: geom.coordinates,
                    zoom: Math.max(zoom, mapInstance.getZoom() + 1.5),
                  });
                }
              } catch {
                // Ignore zoom error
              }
            }
          });

          // Interactions: Unclustered Point / Label Click -> Show Popup & Select Cluster
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const handlePointSelect = (e: any) => {
            if (!e.features?.length) return;
            const f = e.features[0];
            const props = f.properties;
            const geom = f.geometry;
            if (geom.type !== "Point") return;
            const coords = geom.coordinates.slice() as [number, number];

            const item: MapClusterItem = {
              pincode: props.pincode || "",
              locality: props.locality || props.area || "",
              city: props.city || "",
              count: Number(props.report_count) || 1,
              top_scam_type: props.dominant_category || props.top_scam_type || "",
              severity: props.severity || props.risk_level || "MED",
              lat: coords[1],
              lng: coords[0],
            };

            onSelectCluster(item);

            if (popupRef.current) {
              popupRef.current.remove();
            }

            popupRef.current = new maplibregl.Popup({
              offset: 14,
              closeButton: true,
              className: "cyberforge-map-popup",
            })
              .setLngLat(coords)
              .setHTML(createPopupContent(item))
              .addTo(mapInstance);
          };

          mapInstance.on("click", "unclustered-point", handlePointSelect);
          mapInstance.on("click", "unclustered-label", handlePointSelect);

          // Change cursor on hover
          mapInstance.on("mouseenter", "clusters", () => {
            mapInstance.getCanvas().style.cursor = "pointer";
          });
          mapInstance.on("mouseleave", "clusters", () => {
            mapInstance.getCanvas().style.cursor = "";
          });
          mapInstance.on("mouseenter", "unclustered-point", () => {
            mapInstance.getCanvas().style.cursor = "pointer";
          });
          mapInstance.on("mouseleave", "unclustered-point", () => {
            mapInstance.getCanvas().style.cursor = "";
          });
          mapInstance.on("mouseenter", "unclustered-label", () => {
            mapInstance.getCanvas().style.cursor = "pointer";
          });
          mapInstance.on("mouseleave", "unclustered-label", () => {
            mapInstance.getCanvas().style.cursor = "";
          });

          mapRef.current = mapInstance;
          setMapLoaded(true);
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mapInstance.on("error", (e: any) => {
          console.warn("MapLibre tile/style warning:", e);
        });
      } catch (err: unknown) {
        console.error("MapLibre initialization failure:", err);
        setMapError(
          err instanceof Error
            ? err.message
            : "Failed to initialize MapLibre GL map instance."
        );
      }
    }

    initMap();

    return () => {
      isCancelled = true;
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      if (mapInstance) {
        mapInstance.remove();
        mapRef.current = null;
      }
    };
  }, [activeProvider, attachScamDataLayers, createPopupContent, isHi, onSelectCluster]);

  // Sync GeoJSON data to map sources when geojsonData changes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    try {
      const clusterSource = mapRef.current.getSource("scam-cluster-source");
      if (clusterSource && clusterSource.setData) {
        clusterSource.setData(geojsonData);
      }
      const heatmapSource = mapRef.current.getSource("scam-heatmap-source");
      if (heatmapSource && heatmapSource.setData) {
        heatmapSource.setData(geojsonData);
      }
    } catch (err) {
      console.warn("Could not update map GeoJSON data:", err);
    }
  }, [geojsonData, mapLoaded]);

  // Sync layer visibility toggles independently
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    try {
      if (mapRef.current.getLayer("scam-heatmap")) {
        mapRef.current.setLayoutProperty(
          "scam-heatmap",
          "visibility",
          showHeatmap ? "visible" : "none"
        );
      }

      const clusterVis = showClusters ? "visible" : "none";
      if (mapRef.current.getLayer("clusters")) {
        mapRef.current.setLayoutProperty("clusters", "visibility", clusterVis);
      }
      if (mapRef.current.getLayer("cluster-count")) {
        mapRef.current.setLayoutProperty("cluster-count", "visibility", clusterVis);
      }
      if (mapRef.current.getLayer("cluster-label")) {
        mapRef.current.setLayoutProperty("cluster-label", "visibility", clusterVis);
      }

      const markerVis = showMarkers ? "visible" : "none";
      if (mapRef.current.getLayer("unclustered-point")) {
        mapRef.current.setLayoutProperty("unclustered-point", "visibility", markerVis);
      }
      if (mapRef.current.getLayer("unclustered-label")) {
        mapRef.current.setLayoutProperty("unclustered-label", "visibility", markerVis);
      }
    } catch (err) {
      console.warn("Could not toggle map layers:", err);
    }
  }, [showHeatmap, showClusters, showMarkers, mapLoaded]);

  // Fly to selected cluster if selected from external list or search
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !selectedCluster) return;

    mapRef.current.flyTo({
      center: [selectedCluster.lng, selectedCluster.lat],
      zoom: Math.max(mapRef.current.getZoom(), 8),
      essential: true,
      duration: 1200,
    });
  }, [selectedCluster, mapLoaded]);

  // Fly to searched coordinates if clean area (no cluster selected)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !searchedCoordinates || selectedCluster) return;

    mapRef.current.flyTo({
      center: searchedCoordinates,
      zoom: 11,
      essential: true,
      duration: 1200,
    });
  }, [searchedCoordinates, selectedCluster, mapLoaded]);

  // Jump to specific evaluated location
  const handleJumpToLocation = (loc: (typeof TEST_LOCATIONS)[0]) => {
    if (!mapRef.current) return;
    setActiveLocation(loc.name);
    mapRef.current.flyTo({
      center: loc.center,
      zoom: loc.zoom,
      essential: true,
      duration: 1100,
    });
  };

  // Custom Zoom controls
  const handleZoomIn = () => {
    if (!mapRef.current) return;
    mapRef.current.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    if (!mapRef.current) return;
    mapRef.current.zoomOut({ duration: 300 });
  };

  const handleReset = () => {
    if (!mapRef.current) return;
    setActiveLocation(null);
    mapRef.current.flyTo({
      center: INDIA_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 0,
      bearing: 0,
      duration: 800,
    });
  };

  return (
    <div
      className={`relative w-full h-[600px] sm:h-[660px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col ${className}`}
    >
      {/* ── Top Bar: Layer Controls & Basemap Provider Selector ──────── */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-md shadow-xl text-xs max-w-[calc(100%-80px)] sm:max-w-none">
        {/* Layer Toggles */}
        <button
          type="button"
          onClick={() => setShowMarkers((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
            showMarkers
              ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          }`}
          title={isHi ? "स्थान और मार्कर नाम दिखाएं / छिपाएं" : "Toggle area labels & markers"}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{isHi ? "स्थान नाम व मार्कर" : "Markers & Names"}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowClusters((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
            showClusters
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          }`}
          title={isHi ? "क्लस्टर समूहीकरण दिखाएं / छिपाएं" : "Toggle clustering"}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>{isHi ? "क्लस्टर" : "Clusters"}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowHeatmap((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
            showHeatmap
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          }`}
          title={isHi ? "घनत्व हीटमैप दिखाएं / छिपाएं" : "Toggle scam density heatmap"}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{isHi ? "हीटमैप" : "Heatmap"}</span>
        </button>

        {/* Basemap Provider Selector */}
        <div className="h-4 w-px bg-slate-700/80 mx-0.5 hidden sm:block" />

        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1 pl-1">
            <Globe2 className="w-3 h-3 text-slate-400" />
            <span className="hidden md:inline">Base:</span>
          </span>
          <button
            type="button"
            onClick={() => setActiveProvider("openfreemap")}
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
              activeProvider === "openfreemap"
                ? "bg-slate-700 text-teal-300 shadow-sm border border-teal-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="OpenFreeMap with enhanced high-contrast labels (No key needed)"
          >
            OpenFreeMap
          </button>
          <button
            type="button"
            onClick={() => setActiveProvider("maptiler")}
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
              activeProvider === "maptiler"
                ? "bg-slate-700 text-teal-300 shadow-sm border border-teal-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="MapTiler Streets (Requires NEXT_PUBLIC_MAPTILER_API_KEY)"
          >
            MapTiler
          </button>
          <button
            type="button"
            onClick={() => setActiveProvider("esri")}
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
              activeProvider === "esri"
                ? "bg-slate-700 text-teal-300 shadow-sm border border-teal-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Esri ArcGIS World Basemap"
          >
            ArcGIS
          </button>
        </div>
      </div>

      {/* ── Zoom and Reset Controls (Top Right) ─────────────────────── */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-xl">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title={isHi ? "ज़ूम इन" : "Zoom in"}
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title={isHi ? "ज़ूम आउट" : "Zoom out"}
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="p-2 rounded-lg text-slate-300 hover:text-teal-400 hover:bg-slate-800 transition-colors"
          title={isHi ? "भारत केंद्रित दृश्य रीसेट करें" : "Reset to All India view"}
          aria-label="Reset map view"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Tested Locations Quick-Jump Bar (Top-Center Floating Pills) ─ */}
      <div className="absolute top-14 left-3 z-10 hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/85 border border-slate-800/80 backdrop-blur-md shadow-lg text-[11px]">
        <span className="text-slate-400 pl-1.5 pr-0.5 font-medium flex items-center gap-1 text-[10px] uppercase tracking-wider">
          <Navigation className="w-3 h-3 text-teal-400" />
          <span>Jump:</span>
        </span>
        {TEST_LOCATIONS.map((loc) => (
          <button
            key={loc.name}
            type="button"
            onClick={() => handleJumpToLocation(loc)}
            className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
              activeLocation === loc.name
                ? "bg-teal-500/25 text-teal-300 border border-teal-500/50"
                : "text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent"
            }`}
            title={`Inspect ${loc.name} labels and street grid at zoom 11`}
          >
            {loc.name}
          </button>
        ))}
      </div>

      {/* ── Map Container Canvas ────────────────────────────────────── */}
      <div
        ref={mapContainerRef}
        className="w-full flex-1 bg-slate-950"
        style={{ minHeight: "100%" }}
      />

      {/* ── Error Fallback ─────────────────────────────────────────── */}
      {mapError && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="p-3 rounded-full bg-rose-500/10 text-rose-400 mb-3 border border-rose-500/30">
            <MapPin className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-200 mb-1">
            {isHi ? "नक्शा रेंडर करने में असमर्थ" : "Map Rendering Unavailable"}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-4">{mapError}</p>
          <button
            type="button"
            onClick={() => {
              setMapError(null);
              setActiveProvider("openfreemap");
            }}
            className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-semibold text-xs hover:bg-teal-400 transition-colors"
          >
            {isHi ? "ओपनफ्रीमैप के साथ पुनः प्रयास करें" : "Retry with OpenFreeMap"}
          </button>
        </div>
      )}

      {/* ── Map Legend & Privacy Safeguard Pill (Bottom Overlay) ────── */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2">
        {/* Severity Legend */}
        <div className="pointer-events-auto p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-xl text-[11px] text-slate-300 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>{isHi ? "जोखिम तीव्रता" : "Risk Severity"}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              <span className="text-slate-300">CRIT (20+)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <span className="text-slate-300">HIGH (5-19)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
              <span className="text-slate-300">MED (1-4)</span>
            </span>
          </div>
          {showHeatmap && (
            <div className="pt-1 border-t border-slate-800 flex items-center gap-2 text-[10px] text-slate-400">
              <span>{isHi ? "कम घनत्व" : "Low"}</span>
              <div className="w-24 h-1.5 rounded-full bg-gradient-to-r from-teal-500 via-amber-500 to-rose-500" />
              <span>{isHi ? "उच्च घनत्व" : "High Density"}</span>
            </div>
          )}
        </div>

        {/* Privacy Standard & Provider Status Pill */}
        <div className="pointer-events-auto flex flex-col sm:flex-row items-end sm:items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-xl text-[10.5px] text-slate-400 font-mono">
            Provider:{" "}
            <span className="text-teal-300 font-semibold uppercase">
              {activeProvider === "openfreemap"
                ? "OpenFreeMap (Enhanced)"
                : activeProvider === "maptiler"
                ? "MapTiler Streets"
                : "Esri ArcGIS"}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-xl text-[11px] text-teal-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              {isHi
                ? "पिन कोड सेंट्रोइड आधारित • कोई व्यक्तिगत जीपीएस नहीं"
                : "Locality Centroid • No Personal GPS Stored"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GeospatialMapView;
