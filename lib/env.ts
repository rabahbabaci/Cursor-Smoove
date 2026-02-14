import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32).optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_VERIFY_SERVICE_SID: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  MAPBOX_TOKEN: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  UPLOADTHING_TOKEN: z.string().min(1).optional(),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1),
});

export function getServerEnv() {
  const parsed = serverEnvSchema.parse(process.env);
  if (!parsed.SESSION_SECRET && !parsed.NEXTAUTH_SECRET) {
    throw new Error("Provide SESSION_SECRET or NEXTAUTH_SECRET");
  }
  return parsed;
}

export function getClientEnv() {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  });
}
