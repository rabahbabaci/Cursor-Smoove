import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (!stripeSecret) {
  // Only throw at runtime when actually imported by server routes.
  console.warn("STRIPE_SECRET_KEY is not set.");
}

export const stripe = new Stripe(stripeSecret ?? "sk_test_placeholder", {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});
