import { BookingStatus } from "@prisma/client";
import { notFound, redirect } from "next/navigation";

import { EstimateWizard } from "@/components/estimate/estimate-wizard";
import { requireSessionUser } from "@/lib/auth/session";
import { getPricingConfig, getVehicleTiers } from "@/lib/data/pricing";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type EstimatePageProps = {
  params: { draftId: string };
};

export default async function EstimateDraftPage({ params }: EstimatePageProps) {
  const user = await requireSessionUser(`/auth?next=/estimate/${params.draftId}`);

  const draft = await prisma.booking.findFirst({
    where: {
      id: params.draftId,
      userId: user.id,
      status: {
        notIn: [BookingStatus.CANCELLED, BookingStatus.COMPLETE],
      },
    },
    include: {
      stops: {
        orderBy: { order: "asc" },
      },
      items: true,
      photos: true,
    },
  });

  if (!draft) {
    notFound();
  }

  if (draft.status !== BookingStatus.DRAFT && draft.status !== BookingStatus.PENDING_PAYMENT && draft.status !== BookingStatus.SCHEDULED && draft.status !== BookingStatus.PENDING_CREW) {
    redirect(`/bookings/${draft.id}`);
  }

  const [tiers, config] = await Promise.all([getVehicleTiers(), getPricingConfig()]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50/40 to-white px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl">
        <EstimateWizard
          tiers={tiers}
          config={config}
          draft={{
            id: draft.id,
            vehicleType: draft.vehicleType,
            scheduleType: draft.scheduleType as "ON_DEMAND" | "SCHEDULED" | null,
            scheduledAt: draft.scheduledAt?.toISOString() ?? null,
            pickupWindowStart: draft.pickupWindowStart?.toISOString() ?? null,
            pickupWindowEnd: draft.pickupWindowEnd?.toISOString() ?? null,
            additionalNotes: draft.additionalNotes,
            onDemandEtaMin: draft.onDemandEtaMin,
            onDemandEtaMax: draft.onDemandEtaMax,
            routeDistanceMeters: draft.routeDistanceMeters,
            routeDurationMinutes: draft.routeDurationMinutes,
            stops: draft.stops,
            items: draft.items,
            photos: draft.photos,
          }}
        />
      </div>
    </main>
  );
}
