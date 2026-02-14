import Link from "next/link";
import { BookingStatus } from "@prisma/client";

import { SmooveLogo } from "@/components/brand/smoove-logo";
import { AuthNav } from "@/components/auth/auth-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { centsToCurrency } from "@/lib/utils";

const upcomingStatuses = new Set([
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.PENDING_CREW,
  BookingStatus.SCHEDULED,
  BookingStatus.ASSIGNED,
  BookingStatus.EN_ROUTE,
  BookingStatus.ARRIVED_PICKUP,
  BookingStatus.LOADING,
  BookingStatus.IN_TRANSIT,
  BookingStatus.ARRIVED_DROPOFF,
]);

const editableStatuses = new Set([
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.PENDING_CREW,
  BookingStatus.SCHEDULED,
  BookingStatus.ASSIGNED,
]);

export default async function DashboardPage() {
  const user = await requireSessionUser("/auth?next=/dashboard");

  const bookings = await prisma.booking.findMany({
    where: {
      userId: user.id,
      status: { not: BookingStatus.DRAFT },
    },
    include: {
      stops: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const upcoming = bookings.filter((booking) => upcomingStatuses.has(booking.status));
  const past = bookings.filter((booking) => !upcomingStatuses.has(booking.status));

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50/40 to-white px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
          <div>
            <SmooveLogo />
            <h1 className="mt-3 text-2xl font-semibold">Your moves</h1>
            <p className="text-sm text-muted-foreground">Upcoming and past bookings</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline">New estimate</Button>
            </Link>
            <AuthNav phone={user.phone} />
          </div>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Upcoming moves</h2>
          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">No upcoming bookings yet.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {upcoming.map((booking) => {
                const pickup = booking.stops[0]?.addressText ?? "Pickup";
                const dropoff = booking.stops[booking.stops.length - 1]?.addressText ?? "Dropoff";

                return (
                  <Card key={booking.id}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg">
                            {pickup} → {dropoff}
                          </CardTitle>
                          <CardDescription>
                            {booking.vehicleType ?? "Vehicle pending"} • {booking.scheduleType ?? "Schedule pending"}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{booking.status.replaceAll("_", " ")}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        {booking.totalEstimateCents
                          ? `Estimate: ${centsToCurrency(booking.totalEstimateCents)}`
                          : "Estimate pending"}
                      </p>
                      <div className="flex gap-2">
                        {editableStatuses.has(booking.status) ? (
                          <Link href={`/estimate/${booking.id}`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                        ) : null}
                        <Link href={`/bookings/${booking.id}`}>
                          <Button size="sm">View details</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Past moves</h2>
          {past.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">No past bookings yet.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {past.map((booking) => {
                const pickup = booking.stops[0]?.addressText ?? "Pickup";
                const dropoff = booking.stops[booking.stops.length - 1]?.addressText ?? "Dropoff";
                return (
                  <Card key={booking.id}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <p className="font-medium">
                          {pickup} → {dropoff}
                        </p>
                        <p className="text-sm text-muted-foreground">{booking.status.replaceAll("_", " ")}</p>
                      </div>
                      <Link href={`/bookings/${booking.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
