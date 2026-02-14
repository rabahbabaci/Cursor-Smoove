const MAPBOX_BASE_URL = "https://api.mapbox.com";

export async function searchAddress(query: string) {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    throw new Error("MAPBOX_TOKEN missing");
  }

  const url = new URL(
    `/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
    MAPBOX_BASE_URL,
  );
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("types", "address,place,poi");
  url.searchParams.set("limit", "5");
  url.searchParams.set("access_token", token);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to search addresses");
  }

  const data = (await response.json()) as {
    features: Array<{
      place_name: string;
      center: [number, number];
      id: string;
    }>;
  };

  return data.features.map((feature) => ({
    id: feature.id,
    label: feature.place_name,
    lng: feature.center[0],
    lat: feature.center[1],
  }));
}

export async function getRoute(points: Array<{ lng: number; lat: number }>) {
  if (points.length < 2) {
    return null;
  }
  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    throw new Error("MAPBOX_TOKEN missing");
  }

  const coordinateString = points.map((point) => `${point.lng},${point.lat}`).join(";");
  const url = new URL(`/directions/v5/mapbox/driving/${coordinateString}`, MAPBOX_BASE_URL);
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("steps", "false");
  url.searchParams.set("access_token", token);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to fetch route");
  }

  const data = (await response.json()) as {
    routes: Array<{
      distance: number;
      duration: number;
      geometry: { coordinates: [number, number][] };
    }>;
  };

  const route = data.routes[0];
  if (!route) {
    return null;
  }

  return {
    distanceMeters: route.distance,
    distanceMiles: route.distance / 1609.34,
    durationMinutes: Math.round(route.duration / 60),
    geometry: route.geometry.coordinates,
  };
}
