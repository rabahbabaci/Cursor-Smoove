import { PrismaClient, VehicleType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.pricingConfig.upsert({
    where: { id: "default" },
    update: {
      heavyItemFeeCentsPerItem: 1500,
      stairsFeeCentsPerFlightPerLocation: 900,
      assemblyFeeCentsPerItem: 1200,
      serviceFeeBasisPoints: 900,
      taxBasisPoints: 825,
    },
    create: {
      id: "default",
      heavyItemFeeCentsPerItem: 1500,
      stairsFeeCentsPerFlightPerLocation: 900,
      assemblyFeeCentsPerItem: 1200,
      serviceFeeBasisPoints: 900,
      taxBasisPoints: 825,
    },
  });

  const tiers: Array<{
    vehicleType: VehicleType;
    name: string;
    subtitle: string;
    activationFeeCents: number;
    includedLaborMinutes: number;
    laborRateCentsPerMin: number;
    travelRateCentsPerMin: number;
    mileageRateCentsPerMile: number;
    baseMinutes: number;
    perItemMinutes: number;
    heavyMultiplier: number;
    bulkyMultiplier: number;
    perStopOverheadMinutes: number;
  }> = [
    {
      vehicleType: VehicleType.SWIFT,
      name: "Swift",
      subtitle: "Pickup Truck",
      activationFeeCents: 3900,
      includedLaborMinutes: 20,
      laborRateCentsPerMin: 170,
      travelRateCentsPerMin: 95,
      mileageRateCentsPerMile: 230,
      baseMinutes: 34,
      perItemMinutes: 2.1,
      heavyMultiplier: 1.35,
      bulkyMultiplier: 1.2,
      perStopOverheadMinutes: 8,
    },
    {
      vehicleType: VehicleType.FLEX,
      name: "Flex",
      subtitle: "Cargo Van",
      activationFeeCents: 4900,
      includedLaborMinutes: 24,
      laborRateCentsPerMin: 195,
      travelRateCentsPerMin: 105,
      mileageRateCentsPerMile: 260,
      baseMinutes: 38,
      perItemMinutes: 2.3,
      heavyMultiplier: 1.4,
      bulkyMultiplier: 1.24,
      perStopOverheadMinutes: 9,
    },
    {
      vehicleType: VehicleType.ELEVATE,
      name: "Elevate",
      subtitle: "High Roof Van",
      activationFeeCents: 5900,
      includedLaborMinutes: 26,
      laborRateCentsPerMin: 220,
      travelRateCentsPerMin: 115,
      mileageRateCentsPerMile: 285,
      baseMinutes: 42,
      perItemMinutes: 2.6,
      heavyMultiplier: 1.45,
      bulkyMultiplier: 1.28,
      perStopOverheadMinutes: 10,
    },
    {
      vehicleType: VehicleType.TITAN,
      name: "Titan",
      subtitle: "Box Truck",
      activationFeeCents: 7900,
      includedLaborMinutes: 30,
      laborRateCentsPerMin: 260,
      travelRateCentsPerMin: 130,
      mileageRateCentsPerMile: 330,
      baseMinutes: 48,
      perItemMinutes: 3,
      heavyMultiplier: 1.5,
      bulkyMultiplier: 1.35,
      perStopOverheadMinutes: 11,
    },
  ];

  await Promise.all(
    tiers.map((tier) =>
      prisma.vehicleTier.upsert({
        where: { vehicleType: tier.vehicleType },
        update: tier,
        create: tier,
      }),
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
