import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import { notFound } from "next/navigation";

import { SmooveLogo } from "@/components/brand/smoove-logo";
import { BookingDetailClient } from "@/components/dashboard/booking-detail-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { centsToCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type BookingDetailPageProps = {
  params: { id: string };
};

const editableStatuses = new Set<BookingStatus>([
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.PENDING_CREW,
  BookingStatus.SCHEDULED,
  BookingStatus.ASSIGNED,
]);

const cancellableStatuses = new Set<BookingStatus>([
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.PENDING_CREW,
  BookingStatus.SCHEDULED,
  BookingStatus.ASSIGNED,
  BookingStatus.EN_ROUTE,
]);

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const user = await requireSessionUser(`/auth?next=/bookings/${params.id}`);

  const booking = await prisma.booking.findFirst({
    where: {
      id: params.id,
      userId: user.id,
    },
    include: {
      stops: {
        orderBy: { order: "asc" },
      },
      trackingEvents: {
        orderBy: { createdAt: "asc" },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50/40 to-white px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
          <div>
            <SmooveLogo />
            <h1 className="mt-3 text-2xl font-semibold">Booking detail</h1>
            <p className="text-sm text-muted-foreground">Booking #{booking.id.slice(0, 8)}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
            <Link href="/">
              <Button>New estimate</Button>
            </Link>
          </div>
        </header>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {booking.stops[0]?.addressText ?? "Pickup"} → {booking.stops[booking.stops.length - 1]?.addressText ?? "Dropoff"}
            </CardTitle>
            <CardDescription>
              {booking.vehicleType ?? "Vehicle pending"} • {booking.scheduleType ?? "Schedule pending"} •{" "}
              {booking.totalEstimateCents ? centsToCurrency(booking.totalEstimateCents) : "Estimate pending"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-3">
            <p className="rounded-xl border bg-muted/40 p-3">Status: {booking.status.replaceAll("_", " ")}</p>
            <p className="rounded-xl border bg-muted/40 p-3">
              Last payment: {booking.payments[0]?.status ?? "Not paid"}
            </p>
            <p className="rounded-xl border bg-muted/40 p-3">
              Scheduled: {booking.scheduledAt ? booking.scheduledAt.toLocaleString() : "On-demand"}
            </p>
          </CardContent>
        </Card>

        <BookingDetailClient
          bookingId={booking.id}
          status={booking.status}
          routeCoordinates={booking.stops.map((stop) => [stop.lng, stop.lat])}
          stops={booking.stops.map((stop) => ({
            id: stop.id,
            order: stop.order,
            addressText: stop.addressText,
            lat: stop.lat,
            lng: stop.lng,
          }))}
          pricingJson={booking.pricingJson}
          events={booking.trackingEvents.map((event) => ({
            id: event.id,
            type: event.type,
            createdAt: event.createdAt.toISOString(),
          }))}
          canEdit={editableStatuses.has(booking.status)}
          canCancel={cancellableStatuses.has(booking.status)}
          cancelReason={booking.cancelReason}
        />
      </div>
    </main>
  );
}
