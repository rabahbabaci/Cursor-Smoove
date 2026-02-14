import Link from "next/link";
import { notFound } from "next/navigation";

import { SmooveLogo } from "@/components/brand/smoove-logo";
import { TrackingLive } from "@/components/dashboard/tracking-live";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

type TrackingPageProps = {
  params: { id: string };
};

export default async function TrackingPage({ params }: TrackingPageProps) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
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
    notFound();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50/40 to-white px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
          <div>
            <SmooveLogo />
            <h1 className="mt-3 text-2xl font-semibold">Live tracking</h1>
            <p className="text-sm text-muted-foreground">Booking #{booking.id.slice(0, 8)}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/bookings/${booking.id}`}>
              <Button variant="outline">Booking detail</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          </div>
        </header>

        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Tracking updates are simulated for MVP and advance as this page polls for updates.
          </CardContent>
        </Card>

        <TrackingLive
          bookingId={booking.id}
          initial={{
            bookingId: booking.id,
            status: booking.status,
            stops: booking.stops.map((stop) => ({
              id: stop.id,
              addressText: stop.addressText,
              lat: stop.lat,
              lng: stop.lng,
            })),
            events: booking.trackingEvents.map((event) => ({
              id: event.id,
              type: event.type,
              createdAt: event.createdAt.toISOString(),
            })),
            currentLocation: null,
            shareUrl: `${appUrl}/tracking/${booking.id}`,
          }}
        />
      </div>
    </main>
  );
}
