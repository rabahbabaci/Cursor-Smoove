import { BookingStatus, VehicleType } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required", loginUrl: "/auth?next=/" }, { status: 401 });
  }

  const body = (await request.json()) as {
    pickupAddress?: string;
    pickupLat?: number;
    pickupLng?: number;
    dropoffAddress?: string;
    dropoffLat?: number;
    dropoffLng?: number;
  };

  const now = new Date();

  const booking = await prisma.booking.create({
    data: {
      userId: user.id,
      status: BookingStatus.DRAFT,
      vehicleType: VehicleType.SWIFT,
      scheduleType: "ON_DEMAND",
      onDemandEtaMin: 30,
      onDemandEtaMax: 90,
      pickupWindowStart: now,
      pickupWindowEnd: new Date(now.getTime() + 60 * 60 * 1000),
      stops: {
        create: [
          {
            order: 0,
            addressText: body.pickupAddress || "Pickup address",
            lat: body.pickupLat ?? 0,
            lng: body.pickupLng ?? 0,
          },
          {
            order: 1,
            addressText: body.dropoffAddress || "Dropoff address",
            lat: body.dropoffLat ?? 0,
            lng: body.dropoffLng ?? 0,
          },
        ],
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ draftId: booking.id });
}
