import { z } from "zod";

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(8)
    .regex(/^\+?[1-9]\d{7,14}$/, "Use international format, e.g. +14155550123"),
});

export const verifyCodeSchema = phoneSchema.extend({
  code: z
    .string()
    .min(6)
    .max(6)
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});
