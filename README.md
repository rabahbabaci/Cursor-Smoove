# Smoove

Production-ready customer-facing moving app.

## Stack

- Frontend: Next.js 14 App Router + TypeScript + Tailwind CSS
- UI: shadcn-style components + lucide-react
- Maps: Mapbox GL JS + Mapbox Directions/Geocoding via server routes
- Auth: Twilio Verify (phone OTP)
- DB: PostgreSQL + Prisma
- Payments: Stripe Checkout + webhook
- Uploads: Uploadthing
- Forms/state: React Hook Form + Zod + server actions

## Features

- Home page with pickup/dropoff address inputs and vehicle comparison
- OTP auth with send/verify/resend and countdown handling
- Multi-step estimate wizard:
  1) Addresses & stops (up to 5 extra, drag/drop reorder)
  2) Vehicle selection with original Smoove SVG artwork
  3) Items/photos/special instructions
  4) Schedule (on-demand or scheduled)
  5) Live pricing review
  6) Stripe checkout
- Required **Cancel estimate** flow available on each wizard step
- Live map updates (pins, route line, ETA, miles) as addresses/stops change
- Transparent real-time pricing breakdown and confidence range
- Dashboard with upcoming/past moves
- Booking detail page with timeline, map snapshot, pricing, edit/cancel policy
- Simulated live tracking page + share tracking link

## Environment

Copy env template:

```bash
cp .env.example .env
```

Fill all required values in `.env`:

- `DATABASE_URL`
- `NEXTAUTH_SECRET` (or `SESSION_SECRET`)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `MAPBOX_TOKEN`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `UPLOADTHING_TOKEN`
- `NEXT_PUBLIC_APP_URL`

## Local development

```bash
npm install
npm run db:generate
npm run db:migrate:dev
npm run db:seed
npm run dev
```

Open <http://localhost:3000>.

## Stripe webhook testing

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Set the emitted signing secret as `STRIPE_WEBHOOK_SECRET`.

## Scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run lint` – lint
- `npm run db:generate` – Prisma client
- `npm run db:migrate:dev` – create/apply local migration
- `npm run db:migrate` – deploy migrations
- `npm run db:seed` – seed vehicle tiers and pricing config
