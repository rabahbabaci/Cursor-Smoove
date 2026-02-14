import { BookingStatus, PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook signature configuration missing" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid webhook signature",
      },
      { status: 400 },
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;
      const sessionId = session.id;
      const amountTotal = session.amount_total ?? 0;
      if (bookingId) {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: { id: true, scheduleType: true },
        });

        if (booking) {
          await prisma.$transaction([
            prisma.payment.updateMany({
              where: { stripeSessionId: sessionId },
              data: {
                status: PaymentStatus.PAID,
                amountCents: amountTotal,
              },
            }),
            prisma.booking.update({
              where: { id: booking.id },
              data: {
                status:
                  booking.scheduleType === "SCHEDULED"
                    ? BookingStatus.SCHEDULED
                    : BookingStatus.PENDING_CREW,
              },
            }),
          ]);
        }
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await prisma.$transaction([
        prisma.payment.updateMany({
          where: { stripeSessionId: session.id },
          data: { status: PaymentStatus.EXPIRED },
        }),
        prisma.booking.updateMany({
          where: { id: session.metadata?.bookingId, status: BookingStatus.PENDING_PAYMENT },
          data: { status: BookingStatus.DRAFT },
        }),
      ]);
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const payment = await prisma.payment.findFirst({
        where: {
          stripeSessionId: paymentIntent.metadata.checkout_session_id,
        },
      });
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED },
        });
      }
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
