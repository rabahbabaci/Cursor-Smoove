import { type VehicleTier, type VehicleType } from "@prisma/client";

import { VehicleIllustration } from "@/components/brand/vehicle-illustrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, centsToCurrency } from "@/lib/utils";

type VehicleCardProps = {
  tier: VehicleTier;
  selected: boolean;
  onSelect: (vehicleType: VehicleType) => void;
  onContinue?: (vehicleType: VehicleType) => void;
};

export function VehicleCard({ tier, selected, onSelect, onContinue }: VehicleCardProps) {
  return (
    <Card className={cn("h-full transition", selected ? "border-primary ring-2 ring-primary/15" : "")}>
      <CardHeader>
        <CardTitle>{tier.name}</CardTitle>
        <CardDescription>{tier.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <VehicleIllustration vehicleType={tier.vehicleType} className="h-28 w-full" />
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Activation Fee</dt>
            <dd>{centsToCurrency(tier.activationFeeCents)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Labor rate</dt>
            <dd>{centsToCurrency(tier.laborRateCentsPerMin)}/min</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Included labor</dt>
            <dd>{tier.includedLaborMinutes} min</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Travel rate</dt>
            <dd>{centsToCurrency(tier.travelRateCentsPerMin)}/min</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Mileage rate</dt>
            <dd>{centsToCurrency(tier.mileageRateCentsPerMile)}/mile</dd>
          </div>
        </dl>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant={selected ? "default" : "outline"} onClick={() => onSelect(tier.vehicleType)}>
            {selected ? "Selected" : "Select"}
          </Button>
          <Button onClick={() => onContinue?.(tier.vehicleType)}>Continue</Button>
        </div>
      </CardContent>
    </Card>
  );
}
