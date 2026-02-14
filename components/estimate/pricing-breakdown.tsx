import { type EstimateBreakdown } from "@/lib/pricing";
import { centsToCurrency } from "@/lib/utils";

type PricingBreakdownProps = {
  breakdown: EstimateBreakdown;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium text-right">{value}</p>
    </div>
  );
}

export function PricingBreakdown({ breakdown }: PricingBreakdownProps) {
  return (
    <div className="space-y-3 rounded-2xl border bg-white p-4">
      <Row label="Vehicle activation fee" value={centsToCurrency(breakdown.activationFeeCents)} />
      <Row label="Included labor minutes" value={`${breakdown.includedLaborMinutes} min`} />
      <Row
        label={`Estimated labor beyond included (${breakdown.laborBeyondIncludedMinutes} min)`}
        value={centsToCurrency(breakdown.laborBeyondIncludedCents)}
      />
      <Row
        label={`Estimated travel time (${breakdown.travelMinutes} min)`}
        value={centsToCurrency(breakdown.travelCents)}
      />
      <Row
        label={`Mileage (${breakdown.mileageMiles.toFixed(1)} miles)`}
        value={centsToCurrency(breakdown.mileageCents)}
      />
      <Row label="Add-ons: heavy items" value={centsToCurrency(breakdown.addOnHeavyCents)} />
      <Row label="Add-ons: stairs" value={centsToCurrency(breakdown.addOnStairsCents)} />
      <Row label="Add-ons: assembly" value={centsToCurrency(breakdown.addOnAssemblyCents)} />
      <Row label="Service fee" value={centsToCurrency(breakdown.serviceFeeCents)} />
      <Row label="Taxes" value={centsToCurrency(breakdown.taxCents)} />
      <div className="my-2 h-px bg-border" />
      <Row label="Total estimate" value={centsToCurrency(breakdown.totalEstimateCents)} />
      <Row
        label="Most moves like this cost"
        value={`${centsToCurrency(breakdown.confidenceLowCents)} – ${centsToCurrency(
          breakdown.confidenceHighCents,
        )}`}
      />
      <p className="text-xs text-muted-foreground">
        This is an estimate, not a final invoice. Final charges depend on actual labor time, route conditions, and approved add-ons.
      </p>
    </div>
  );
}
