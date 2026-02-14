"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { RouteMap } from "@/components/map/route-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TrackingPayload = {
  bookingId: string;
  status: string;
  stops: Array<{
    id: string;
    addressText: string;
    lat: number;
    lng: number;
  }>;
  events: Array<{
    id: string;
    type: string;
    createdAt: string;
  }>;
  currentLocation: { lat: number; lng: number } | null;
  shareUrl: string;
};

const timeline = [
  "ASSIGNED",
  "EN_ROUTE",
  "ARRIVED_PICKUP",
  "LOADING",
  "IN_TRANSIT",
  "ARRIVED_DROPOFF",
  "COMPLETE",
];

export function TrackingLive({ bookingId, initial }: { bookingId: string; initial: TrackingPayload }) {
  const [data, setData] = useState<TrackingPayload>(initial);
  const [loading, setLoading] = useState(false);

  const routeCoordinates = useMemo(
    () => data.stops.map((stop) => [stop.lng, stop.lat] as [number, number]),
    [data.stops],
  );
  const doneSet = useMemo(() => new Set([...data.events.map((event) => event.type), data.status]), [data.events, data.status]);

  const refresh = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bookings/${bookingId}/track`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as TrackingPayload & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to refresh tracking");
      }
      setData(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to refresh tracking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      void refresh();
    }, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-lg">
              Live route
              <Badge>{data.status.replaceAll("_", " ")}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RouteMap
              stops={data.stops.map((stop) => ({
                id: stop.id,
                label: stop.addressText,
                lat: stop.lat,
                lng: stop.lng,
              }))}
              routeCoordinates={routeCoordinates}
              trackingPoint={data.currentLocation}
              className="h-[380px]"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={refresh} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(data.shareUrl || `${window.location.origin}/tracking/${bookingId}`);
                  toast.success("Tracking link copied");
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Share tracking link
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {timeline.map((entry) => {
              const done = doneSet.has(entry);
              return (
                <div key={entry} className="flex items-center gap-2 rounded-xl border p-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${done ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                  <p className={done ? "font-medium" : "text-muted-foreground"}>{entry.replaceAll("_", " ")}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
