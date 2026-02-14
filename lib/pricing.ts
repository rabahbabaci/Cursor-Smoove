import { type PricingConfig, type VehicleTier } from "@prisma/client";

export type PricingItemInput = {
  qty: number;
  isHeavy: boolean;
  isBulky: boolean;
  requiresAssembly?: boolean;
};

export type PricingInput = {
  vehicle: VehicleTier;
  config: PricingConfig;
  routeDistanceMiles: number;
  routeDurationMinutes: number;
  stopCount: number;
  items: PricingItemInput[];
  stairsFlightsByLocation: number[];
};

export type EstimateBreakdown = {
  activationFeeCents: number;
  includedLaborMinutes: number;
  estimatedLaborMinutes: number;
  laborBeyondIncludedMinutes: number;
  laborBeyondIncludedCents: number;
  travelMinutes: number;
  travelCents: number;
  mileageMiles: number;
  mileageCents: number;
  addOnHeavyCents: number;
  addOnStairsCents: number;
  addOnAssemblyCents: number;
  subtotalCents: number;
  serviceFeeCents: number;
  taxCents: number;
  totalEstimateCents: number;
  confidenceLowCents: number;
  confidenceHighCents: number;
};

function roundMinutes(value: number) {
  return Math.max(0, Math.round(value));
}

function complexityAdjustment(totalItems: number, heavyUnits: number, bulkyUnits: number) {
  const pressure = heavyUnits * 0.012 + bulkyUnits * 0.01 + totalItems * 0.0025;
  return Math.min(0.22, Math.max(0.06, pressure));
}

export function calculateEstimate(input: PricingInput): EstimateBreakdown {
  const { vehicle, config, items, routeDistanceMiles, routeDurationMinutes, stairsFlightsByLocation, stopCount } =
    input;

  const totalUnits = items.reduce((sum, item) => sum + item.qty, 0);
  const heavyUnits = items.reduce((sum, item) => sum + (item.isHeavy ? item.qty : 0), 0);
  const bulkyUnits = items.reduce((sum, item) => sum + (item.isBulky ? item.qty : 0), 0);
  const assemblyUnits = items.reduce((sum, item) => sum + (item.requiresAssembly ? item.qty : 0), 0);
  const stairsFlights = stairsFlightsByLocation.reduce((sum, flights) => sum + Math.max(0, flights), 0);
  const additionalStops = Math.max(0, stopCount - 2);

  const baseLabor =
    vehicle.baseMinutes +
    totalUnits * vehicle.perItemMinutes +
    heavyUnits * vehicle.perItemMinutes * (vehicle.heavyMultiplier - 1) +
    bulkyUnits * vehicle.perItemMinutes * (vehicle.bulkyMultiplier - 1) +
    stairsFlights * 3 +
    additionalStops * vehicle.perStopOverheadMinutes;

  const estimatedLaborMinutes = roundMinutes(baseLabor);
  const laborBeyondIncludedMinutes = Math.max(0, estimatedLaborMinutes - vehicle.includedLaborMinutes);
  const laborBeyondIncludedCents = laborBeyondIncludedMinutes * vehicle.laborRateCentsPerMin;

  const travelMinutes = roundMinutes(routeDurationMinutes);
  const travelCents = travelMinutes * vehicle.travelRateCentsPerMin;

  const mileageMiles = Number(routeDistanceMiles.toFixed(1));
  const mileageCents = Math.round(mileageMiles * vehicle.mileageRateCentsPerMile);

  const addOnHeavyCents = heavyUnits * config.heavyItemFeeCentsPerItem;
  const addOnStairsCents = stairsFlights * config.stairsFeeCentsPerFlightPerLocation;
  const addOnAssemblyCents = assemblyUnits * config.assemblyFeeCentsPerItem;

  const subtotalCents =
    vehicle.activationFeeCents +
    laborBeyondIncludedCents +
    travelCents +
    mileageCents +
    addOnHeavyCents +
    addOnStairsCents +
    addOnAssemblyCents;

  const serviceFeeCents = Math.round((subtotalCents * config.serviceFeeBasisPoints) / 10_000);
  const taxCents = Math.round(((subtotalCents + serviceFeeCents) * config.taxBasisPoints) / 10_000);
  const totalEstimateCents = subtotalCents + serviceFeeCents + taxCents;

  const spread = complexityAdjustment(totalUnits, heavyUnits, bulkyUnits);
  const confidenceLowCents = Math.round(totalEstimateCents * (1 - spread));
  const confidenceHighCents = Math.round(totalEstimateCents * (1 + spread));

  return {
    activationFeeCents: vehicle.activationFeeCents,
    includedLaborMinutes: vehicle.includedLaborMinutes,
    estimatedLaborMinutes,
    laborBeyondIncludedMinutes,
    laborBeyondIncludedCents,
    travelMinutes,
    travelCents,
    mileageMiles,
    mileageCents,
    addOnHeavyCents,
    addOnStairsCents,
    addOnAssemblyCents,
    subtotalCents,
    serviceFeeCents,
    taxCents,
    totalEstimateCents,
    confidenceLowCents,
    confidenceHighCents,
  };
}
