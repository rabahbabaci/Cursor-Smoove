"use client";

import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";

import { cn } from "@/lib/utils";

type StopPoint = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

type RouteMapProps = {
  stops: StopPoint[];
  routeCoordinates: [number, number][];
  className?: string;
  interactive?: boolean;
  trackingPoint?: { lat: number; lng: number } | null;
};

const ROUTE_SOURCE_ID = "smoove-route";
const STOPS_SOURCE_ID = "smoove-stops";
const TRACK_SOURCE_ID = "smoove-track";

function getToken() {
  return process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
}

export function RouteMap({
  stops,
  routeCoordinates,
  className,
  interactive = true,
  trackingPoint,
}: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const bounds = useMemo(() => {
    const points = stops.map((stop) => [stop.lng, stop.lat] as [number, number]);
    if (trackingPoint) {
      points.push([trackingPoint.lng, trackingPoint.lat]);
    }
    if (points.length === 0) return null;
    const b = new mapboxgl.LngLatBounds(points[0], points[0]);
    points.slice(1).forEach((point) => b.extend(point));
    return b;
  }, [stops, trackingPoint]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const token = getToken();
    if (!token) return;
    mapboxgl.accessToken = token;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-122.4194, 37.7749],
      zoom: 10,
      interactive,
    });

    mapRef.current.on("load", () => {
      const map = mapRef.current;
      if (!map) return;

      map.addSource(ROUTE_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: routeCoordinates,
          },
          properties: {},
        },
      });

      map.addLayer({
        id: ROUTE_SOURCE_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        paint: {
          "line-color": "#7C3AED",
          "line-width": 5,
          "line-opacity": 0.9,
        },
      });

      map.addSource(STOPS_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: stops.map((stop, index) => ({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [stop.lng, stop.lat],
            },
            properties: {
              title: index === 0 ? "Pickup" : index === stops.length - 1 ? "Dropoff" : `Stop ${index}`,
            },
          })),
        },
      });

      map.addLayer({
        id: `${STOPS_SOURCE_ID}-circle`,
        type: "circle",
        source: STOPS_SOURCE_ID,
        paint: {
          "circle-color": [
            "match",
            ["get", "title"],
            "Pickup",
            "#14B8A6",
            "Dropoff",
            "#F97316",
            "#7C3AED",
          ],
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: `${STOPS_SOURCE_ID}-label`,
        type: "symbol",
        source: STOPS_SOURCE_ID,
        layout: {
          "text-field": ["get", "title"],
          "text-offset": [0, 1.5],
          "text-size": 12,
        },
        paint: {
          "text-color": "#4B5563",
        },
      });

      map.addSource(TRACK_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: trackingPoint
            ? [
                {
                  type: "Feature",
                  geometry: { type: "Point", coordinates: [trackingPoint.lng, trackingPoint.lat] },
                  properties: {},
                },
              ]
            : [],
        },
      });

      map.addLayer({
        id: TRACK_SOURCE_ID,
        type: "circle",
        source: TRACK_SOURCE_ID,
        paint: {
          "circle-color": "#111827",
          "circle-radius": 8,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2,
        },
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [interactive, routeCoordinates, stops, trackingPoint]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const routeSource = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (routeSource) {
      routeSource.setData({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: routeCoordinates,
        },
        properties: {},
      });
    }

    const stopsSource = map.getSource(STOPS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (stopsSource) {
      stopsSource.setData({
        type: "FeatureCollection",
        features: stops.map((stop, index) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [stop.lng, stop.lat],
          },
          properties: {
            title: index === 0 ? "Pickup" : index === stops.length - 1 ? "Dropoff" : `Stop ${index}`,
          },
        })),
      });
    }

    const trackingSource = map.getSource(TRACK_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (trackingSource) {
      trackingSource.setData({
        type: "FeatureCollection",
        features: trackingPoint
          ? [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [trackingPoint.lng, trackingPoint.lat] },
                properties: {},
              },
            ]
          : [],
      });
    }
  }, [routeCoordinates, stops, trackingPoint]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !bounds) return;
    map.fitBounds(bounds, { padding: 50, duration: 500 });
  }, [bounds]);

  return (
    <div
      ref={mapContainerRef}
      className={cn("h-[360px] w-full overflow-hidden rounded-2xl border", className)}
      aria-label="Route map"
    />
  );
}
