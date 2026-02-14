import { BookingStatus, TrackingEventType } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const TRACKING_SEQUENCE: TrackingEventType[] = [
  TrackingEventType.ASSIGNED,
  TrackingEventType.EN_ROUTE,
  TrackingEventType.ARRIVED_PICKUP,
  TrackingEventType.LOADING,
  TrackingEventType.IN_TRANSIT,
  TrackingEventType.ARRIVED_DROPOFF,
  TrackingEventType.COMPLETE,
];

function asBookingStatus(value: TrackingEventType): BookingStatus {
  return value as unknown as BookingStatus;
}

function pointAlongStops(stops: Array<{ lat: number; lng: number }>, ratio: number) {
  if (stops.length === 0) return { lat: 0, lng: 0 };
  if (stops.length === 1) return { lat: stops[0].lat, lng: stops[0].lng };

  const segments = stops.length - 1;
  const scaled = Math.min(segments - 0.0001, Math.max(0, ratio * segments));
  const segmentIndex = Math.floor(scaled);
  const segmentRatio = scaled - segmentIndex;
  const start = stops[segmentIndex];
  const end = stops[segmentIndex + 1];
  return {
    lat: start.lat + (end.lat - start.lat) * segmentRatio,
    lng: start.lng + (end.lng - start.lng) * segmentRatio,
  };
}

function canSimulate(status: BookingStatus) {
  const terminalStatuses = new Set<BookingStatus>([
    BookingStatus.DRAFT,
    BookingStatus.CANCELLED,
    BookingStatus.COMPLETE,
  ]);
  return !terminalStatuses.has(status);
}

export async function GET(
  _request: Request,
  { params }: { params: { bookingId: string } },
) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: {
      stops: {
        orderBy: { order: "asc" },
      },
      trackingEvents: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const now = Date.now();
  let events = booking.trackingEvents;

  if (canSimulate(booking.status)) {
    const latest = events[events.length - 1];
    if (!latest) {
      const payload = pointAlongStops(booking.stops, 0.05);
      const created = await prisma.trackingEvent.create({
        data: {
          bookingId: booking.id,
          type: TrackingEventType.ASSIGNED,
          payloadJson: payload,
        },
      });
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.ASSIGNED },
      });
      events = [...events, created];
    } else {
      const latestIndex = TRACKING_SEQUENCE.findIndex((item) => item === latest.type);
      const elapsedMs = now - new Date(latest.createdAt).getTime();
      const shouldAdvance = elapsedMs > 20_000;
      const nextType = TRACKING_SEQUENCE[latestIndex + 1];
      if (shouldAdvance && nextType) {
        const ratio = (latestIndex + 1) / (TRACKING_SEQUENCE.length - 1);
        const payload = pointAlongStops(booking.stops, ratio);
        const created = await prisma.trackingEvent.create({
          data: {
            bookingId: booking.id,
            type: nextType,
            payloadJson: payload,
          },
        });
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: asBookingStatus(nextType),
          },
        });
        events = [...events, created];
      }
    }
  }

  const latest = events[events.length - 1];
  const currentLocation = (latest?.payloadJson as { lat?: number; lng?: number } | null) ?? null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return NextResponse.json({
    bookingId: booking.id,
    status: booking.status,
    stops: booking.stops,
    events: events.map((event) => ({
      id: event.id,
      type: event.type,
      payloadJson: event.payloadJson,
      createdAt: event.createdAt.toISOString(),
    })),
    currentLocation:
      currentLocation && typeof currentLocation.lat === "number" && typeof currentLocation.lng === "number"
        ? { lat: currentLocation.lat, lng: currentLocation.lng }
        : null,
    shareUrl: `${appUrl}/tracking/${booking.id}`,
  });
}
