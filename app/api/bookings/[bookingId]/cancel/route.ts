import { BookingStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getRequestUser } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  reason: z.string().max(240).optional(),
});

const cancellableStatuses = new Set([
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.PENDING_CREW,
  BookingStatus.SCHEDULED,
  BookingStatus.ASSIGNED,
  BookingStatus.EN_ROUTE,
]);

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } },
) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id: params.bookingId,
      userId: user.id,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!cancellableStatuses.has(booking.status)) {
    return NextResponse.json(
      { error: "This booking can no longer be cancelled online." },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: BookingStatus.CANCELLED,
      cancelReason: parsed.success ? parsed.data.reason ?? "Cancelled by customer" : "Cancelled by customer",
    },
  });

  return NextResponse.json({ ok: true });
}
