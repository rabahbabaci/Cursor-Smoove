import { BookingStatus, PaymentStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getRequestUser } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const schema = z.object({
  bookingId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId } = schema.parse(body);

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: user.id,
      },
      include: {
        stops: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking draft not found" }, { status: 404 });
    }

    if (!booking.totalEstimateCents || booking.totalEstimateCents <= 0) {
      return NextResponse.json(
        {
          error: "Save your estimate first so pricing can be calculated.",
        },
        { status: 400 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const pickupAddress = booking.stops[0]?.addressText ?? "Pickup";
    const dropoffAddress = booking.stops[booking.stops.length - 1]?.addressText ?? "Dropoff";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: undefined,
      metadata: {
        bookingId: booking.id,
        userId: user.id,
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/estimate/${booking.id}`,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Smoove move estimate (${booking.vehicleType ?? "Vehicle pending"})`,
              description: `${pickupAddress} → ${dropoffAddress}`,
            },
            unit_amount: booking.totalEstimateCents,
          },
          quantity: 1,
        },
      ],
    });

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.PENDING_PAYMENT,
        },
      }),
      prisma.payment.create({
        data: {
          bookingId: booking.id,
          stripeSessionId: session.id,
          status: PaymentStatus.PENDING,
          amountCents: booking.totalEstimateCents,
        },
      }),
    ]);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start checkout";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
