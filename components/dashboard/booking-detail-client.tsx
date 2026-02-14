"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Copy, Loader2, MapPinned } from "lucide-react";
import { toast } from "sonner";

import { RouteMap } from "@/components/map/route-map";
import { PricingBreakdown } from "@/components/estimate/pricing-breakdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type EstimateBreakdown } from "@/lib/pricing";

type BookingDetailClientProps = {
  bookingId: string;
  status: string;
  routeCoordinates: [number, number][];
  stops: Array<{
    id: string;
    order: number;
    addressText: string;
    lat: number;
    lng: number;
  }>;
  pricingJson: unknown;
  events: Array<{
    id: string;
    type: string;
    createdAt: string;
  }>;
  canEdit: boolean;
  canCancel: boolean;
  cancelReason: string | null;
};

const timelineOrder = [
  "ASSIGNED",
  "EN_ROUTE",
  "ARRIVED_PICKUP",
  "LOADING",
  "IN_TRANSIT",
  "ARRIVED_DROPOFF",
  "COMPLETE",
];

export function BookingDetailClient({
  bookingId,
  status,
  routeCoordinates,
  stops,
  pricingJson,
  events,
  canEdit,
  canCancel,
  cancelReason,
}: BookingDetailClientProps) {
  const [cancelling, setCancelling] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [currentCancelReason, setCurrentCancelReason] = useState(cancelReason);

  const completedSet = useMemo(() => {
    const completed = new Set(events.map((event) => event.type));
    completed.add(currentStatus);
    return completed;
  }, [events, currentStatus]);

  const handleCancelBooking = async () => {
    try {
      setCancelling(true);
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: "Cancelled from booking detail page" }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to cancel booking");
      }
      setCurrentStatus("CANCELLED");
      setCurrentCancelReason("Cancelled from booking detail page");
      toast.success("Booking cancelled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-lg">
              Status timeline
              <Badge variant="secondary">{currentStatus.replaceAll("_", " ")}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {timelineOrder.map((item) => {
              const done = completedSet.has(item);
              return (
                <div key={item} className="flex items-center gap-3 rounded-xl border p-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${done ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
                  />
                  <p className={done ? "font-medium" : "text-muted-foreground"}>{item.replaceAll("_", " ")}</p>
                </div>
              );
            })}
            {currentCancelReason ? (
              <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Cancellation reason: {currentCancelReason}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {canEdit && currentStatus !== "CANCELLED" ? (
              <Link href={`/estimate/${bookingId}`}>
                <Button className="w-full" variant="outline">
                  Edit booking
                </Button>
              </Link>
            ) : null}
            {canCancel && currentStatus !== "CANCELLED" ? (
              <Button className="w-full" variant="destructive" onClick={handleCancelBooking} disabled={cancelling}>
                {cancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Cancel booking
              </Button>
            ) : null}
            <Link href={`/tracking/${bookingId}`}>
              <Button className="w-full">
                <MapPinned className="mr-2 h-4 w-4" />
                Open live tracking
              </Button>
            </Link>
            <Button
              className="w-full"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(`${window.location.origin}/tracking/${bookingId}`);
                toast.success("Tracking link copied");
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Share tracking link
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Map snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <RouteMap
            interactive={false}
            stops={stops.map((stop) => ({
              id: stop.id,
              label: stop.addressText,
              lat: stop.lat,
              lng: stop.lng,
            }))}
            routeCoordinates={routeCoordinates}
            className="h-[350px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pricing breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {pricingJson ? (
            <PricingBreakdown breakdown={pricingJson as EstimateBreakdown} />
          ) : (
            <p className="text-sm text-muted-foreground">Pricing details not available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
