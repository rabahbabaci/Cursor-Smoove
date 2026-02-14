"use server";

import { BookingStatus, VehicleType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireSessionUser } from "@/lib/auth/session";
import { getPricingConfig, getVehicleTiers } from "@/lib/data/pricing";
import { calculateEstimate } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { type EstimateDraftInput, estimateDraftSchema } from "@/lib/validation/estimate";

type StartEstimatePayload = {
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffAddress?: string;
  dropoffLat?: number;
  dropoffLng?: number;
};

export async function startEstimateAction(payload: StartEstimatePayload = {}) {
  const user = await requireSessionUser("/auth?next=/");
  const now = new Date();

  const booking = await prisma.booking.create({
    data: {
      userId: user.id,
      status: BookingStatus.DRAFT,
      vehicleType: VehicleType.SWIFT,
      scheduleType: "ON_DEMAND",
      onDemandEtaMin: 30,
      onDemandEtaMax: 90,
      stops: {
        create: [
          {
            order: 0,
            addressText: payload.pickupAddress || "Pickup address",
            lat: payload.pickupLat ?? 0,
            lng: payload.pickupLng ?? 0,
          },
          {
            order: 1,
            addressText: payload.dropoffAddress || "Dropoff address",
            lat: payload.dropoffLat ?? 0,
            lng: payload.dropoffLng ?? 0,
          },
        ],
      },
      pickupWindowStart: now,
      pickupWindowEnd: new Date(now.getTime() + 60 * 60 * 1000),
    },
    select: { id: true },
  });

  return booking.id;
}

export async function saveEstimateDraftAction(rawInput: EstimateDraftInput) {
  const user = await requireSessionUser("/auth?next=/");
  const input = estimateDraftSchema.parse(rawInput);

  const booking = await prisma.booking.findFirst({
    where: { id: input.draftId, userId: user.id },
    select: { id: true, status: true },
  });

  if (!booking) {
    throw new Error("Draft estimate not found.");
  }

  const [tiers, config] = await Promise.all([getVehicleTiers(), getPricingConfig()]);
  const vehicle = tiers.find((tier) => tier.vehicleType === input.vehicleType);
  if (!vehicle) {
    throw new Error("Vehicle tier not configured.");
  }

  const estimate = calculateEstimate({
    vehicle,
    config,
    routeDistanceMiles: input.routeDistanceMeters / 1609.34,
    routeDurationMinutes: input.routeDurationMinutes,
    stopCount: input.stops.length,
    stairsFlightsByLocation: input.stops.map((stop) => stop.stairsFlights),
    items: input.items.map((item) => ({
      qty: item.qty,
      isHeavy: item.isHeavy,
      isBulky: item.isBulky,
      requiresAssembly: item.requiresAssembly,
    })),
  });

  const scheduledAt =
    input.scheduleType === "SCHEDULED" && input.scheduledAt ? new Date(input.scheduledAt) : null;
  const pickupWindowStart =
    input.scheduleType === "SCHEDULED" && input.pickupWindowStart
      ? new Date(input.pickupWindowStart)
      : null;
  const pickupWindowEnd =
    input.scheduleType === "SCHEDULED" && input.pickupWindowEnd ? new Date(input.pickupWindowEnd) : null;

  await prisma.$transaction(async (tx) => {
    await tx.stop.deleteMany({ where: { bookingId: input.draftId } });
    await tx.item.deleteMany({ where: { bookingId: input.draftId } });
    await tx.photo.deleteMany({ where: { bookingId: input.draftId } });

    await tx.booking.update({
      where: { id: input.draftId },
      data: {
        status:
          booking.status === BookingStatus.DRAFT || booking.status === BookingStatus.PENDING_PAYMENT
            ? BookingStatus.DRAFT
            : booking.status,
        vehicleType: input.vehicleType,
        scheduleType: input.scheduleType,
        scheduledAt,
        pickupWindowStart,
        pickupWindowEnd,
        onDemandEtaMin: input.onDemandEtaMin,
        onDemandEtaMax: input.onDemandEtaMax,
        routeDistanceMeters: Math.round(input.routeDistanceMeters),
        routeDurationMinutes: Math.round(input.routeDurationMinutes),
        additionalNotes: input.additionalNotes || null,
        subtotalCents: estimate.subtotalCents,
        serviceFeeCents: estimate.serviceFeeCents,
        taxCents: estimate.taxCents,
        totalEstimateCents: estimate.totalEstimateCents,
        totalLowCents: estimate.confidenceLowCents,
        totalHighCents: estimate.confidenceHighCents,
        pricingJson: estimate,
        stops: {
          create: input.stops.map((stop, index) => ({
            order: index,
            addressText: stop.addressText,
            lat: stop.lat,
            lng: stop.lng,
            unit: stop.unit || null,
            gateCode: stop.gateCode || null,
            parkingNotes: stop.parkingNotes || null,
            stairsFlights: stop.stairsFlights,
            contactPhoneOptional: stop.contactPhoneOptional || null,
          })),
        },
        items: {
          create: input.items.map((item) => ({
            name: item.name,
            qty: item.qty,
            isHeavy: item.isHeavy,
            isBulky: item.isBulky,
            requiresAssembly: item.requiresAssembly,
            notes: item.notes || null,
          })),
        },
        photos: {
          create: input.photos.map((url) => ({ url })),
        },
      },
    });
  });

  revalidatePath(`/estimate/${input.draftId}`);
  revalidatePath("/dashboard");

  return estimate;
}

export async function cancelEstimateAction(draftId: string) {
  const user = await requireSessionUser("/auth?next=/");

  const booking = await prisma.booking.findFirst({
    where: {
      id: draftId,
      userId: user.id,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!booking) {
    return;
  }

  if (booking.status === BookingStatus.DRAFT || booking.status === BookingStatus.PENDING_PAYMENT) {
    await prisma.booking.delete({
      where: { id: booking.id },
    });
  }

  revalidatePath(`/estimate/${draftId}`);
  revalidatePath("/dashboard");
}
