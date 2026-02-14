-- Create enums
CREATE TYPE "BookingStatus" AS ENUM (
  'DRAFT',
  'PENDING_PAYMENT',
  'PENDING_CREW',
  'SCHEDULED',
  'ASSIGNED',
  'EN_ROUTE',
  'ARRIVED_PICKUP',
  'LOADING',
  'IN_TRANSIT',
  'ARRIVED_DROPOFF',
  'COMPLETE',
  'CANCELLED'
);

CREATE TYPE "VehicleType" AS ENUM ('SWIFT', 'FLEX', 'ELEVATE', 'TITAN');
CREATE TYPE "ScheduleType" AS ENUM ('ON_DEMAND', 'SCHEDULED');

CREATE TYPE "TrackingEventType" AS ENUM (
  'ASSIGNED',
  'EN_ROUTE',
  'ARRIVED_PICKUP',
  'LOADING',
  'IN_TRANSIT',
  'ARRIVED_DROPOFF',
  'COMPLETE'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
  'EXPIRED'
);

-- Create tables
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleTier" (
  "id" TEXT NOT NULL,
  "vehicleType" "VehicleType" NOT NULL,
  "name" TEXT NOT NULL,
  "subtitle" TEXT NOT NULL,
  "activationFeeCents" INTEGER NOT NULL,
  "includedLaborMinutes" INTEGER NOT NULL,
  "laborRateCentsPerMin" INTEGER NOT NULL,
  "travelRateCentsPerMin" INTEGER NOT NULL,
  "mileageRateCentsPerMile" INTEGER NOT NULL,
  "baseMinutes" INTEGER NOT NULL,
  "perItemMinutes" DOUBLE PRECISION NOT NULL,
  "heavyMultiplier" DOUBLE PRECISION NOT NULL,
  "bulkyMultiplier" DOUBLE PRECISION NOT NULL,
  "perStopOverheadMinutes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleTier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PricingConfig" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "heavyItemFeeCentsPerItem" INTEGER NOT NULL,
  "stairsFeeCentsPerFlightPerLocation" INTEGER NOT NULL,
  "assemblyFeeCentsPerItem" INTEGER NOT NULL,
  "serviceFeeBasisPoints" INTEGER NOT NULL,
  "taxBasisPoints" INTEGER NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PricingConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Booking" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'DRAFT',
  "vehicleType" "VehicleType",
  "scheduleType" "ScheduleType",
  "scheduledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "cancelReason" TEXT,
  "additionalNotes" TEXT,
  "onDemandEtaMin" INTEGER,
  "onDemandEtaMax" INTEGER,
  "routeDistanceMeters" INTEGER,
  "routeDurationMinutes" INTEGER,
  "subtotalCents" INTEGER,
  "serviceFeeCents" INTEGER,
  "taxCents" INTEGER,
  "totalEstimateCents" INTEGER,
  "totalLowCents" INTEGER,
  "totalHighCents" INTEGER,
  "pricingJson" JSONB,
  "pickupWindowStart" TIMESTAMP(3),
  "pickupWindowEnd" TIMESTAMP(3),
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Stop" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "addressText" TEXT NOT NULL,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "unit" TEXT,
  "gateCode" TEXT,
  "parkingNotes" TEXT,
  "stairsFlights" INTEGER NOT NULL DEFAULT 0,
  "contactPhoneOptional" TEXT,
  CONSTRAINT "Stop_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Item" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "qty" INTEGER NOT NULL,
  "isHeavy" BOOLEAN NOT NULL DEFAULT false,
  "isBulky" BOOLEAN NOT NULL DEFAULT false,
  "requiresAssembly" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Photo" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrackingEvent" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "type" "TrackingEventType" NOT NULL,
  "payloadJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "stripeSessionId" TEXT NOT NULL,
  "status" "PaymentStatus" NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "VehicleTier_vehicleType_key" ON "VehicleTier"("vehicleType");
CREATE UNIQUE INDEX "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");

CREATE INDEX "Booking_userId_status_idx" ON "Booking"("userId", "status");
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");
CREATE INDEX "Stop_bookingId_order_idx" ON "Stop"("bookingId", "order");
CREATE INDEX "Item_bookingId_idx" ON "Item"("bookingId");
CREATE INDEX "Photo_bookingId_idx" ON "Photo"("bookingId");
CREATE INDEX "TrackingEvent_bookingId_createdAt_idx" ON "TrackingEvent"("bookingId", "createdAt");
CREATE INDEX "Payment_bookingId_status_idx" ON "Payment"("bookingId", "status");

-- Foreign keys
ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Stop"
  ADD CONSTRAINT "Stop_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Item"
  ADD CONSTRAINT "Item_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Photo"
  ADD CONSTRAINT "Photo_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrackingEvent"
  ADD CONSTRAINT "TrackingEvent_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
