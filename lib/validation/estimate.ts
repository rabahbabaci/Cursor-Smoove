import { VehicleType } from "@prisma/client";
import { z } from "zod";

export const stopSchema = z.object({
  id: z.string().optional(),
  addressText: z.string().min(3, "Address is required"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  unit: z.string().max(50).optional().or(z.literal("")),
  gateCode: z.string().max(50).optional().or(z.literal("")),
  parkingNotes: z.string().max(300).optional().or(z.literal("")),
  stairsFlights: z.number().int().min(0).max(10).default(0),
  contactPhoneOptional: z.string().max(24).optional().or(z.literal("")),
});

export const itemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  qty: z.number().int().min(1).max(100),
  isHeavy: z.boolean().default(false),
  isBulky: z.boolean().default(false),
  requiresAssembly: z.boolean().default(false),
  notes: z.string().max(300).optional().or(z.literal("")),
});

export const estimateDraftSchema = z.object({
  draftId: z.string().min(1),
  stops: z
    .array(stopSchema)
    .min(2, "Pickup and dropoff are required")
    .max(7, "You can add up to 5 extra stops"),
  vehicleType: z.nativeEnum(VehicleType),
  items: z.array(itemSchema).default([]),
  photos: z.array(z.string().url()).default([]),
  additionalNotes: z.string().max(1000).optional().or(z.literal("")),
  scheduleType: z.enum(["ON_DEMAND", "SCHEDULED"]).default("ON_DEMAND"),
  scheduledAt: z.string().datetime().optional().or(z.literal("")),
  pickupWindowStart: z.string().datetime().optional().or(z.literal("")),
  pickupWindowEnd: z.string().datetime().optional().or(z.literal("")),
  onDemandEtaMin: z.number().int().min(10).max(240).default(30),
  onDemandEtaMax: z.number().int().min(20).max(360).default(90),
  routeDistanceMeters: z.number().min(0).default(0),
  routeDurationMinutes: z.number().min(0).default(0),
});

export type EstimateDraftInput = z.infer<typeof estimateDraftSchema>;
