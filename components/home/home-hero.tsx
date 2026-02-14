"use client";

import { type VehicleTier } from "@prisma/client";
import { ArrowRight, Loader2, MapPinned, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { VehicleIllustration } from "@/components/brand/vehicle-illustrations";
import { AddressAutocomplete } from "@/components/map/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { centsToCurrency } from "@/lib/utils";

type LocationValue = {
  addressText: string;
  lat: number;
  lng: number;
};

type HomeHeroProps = {
  tiers: VehicleTier[];
};

export function HomeHero({ tiers }: HomeHeroProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pickup, setPickup] = useState<LocationValue>({
    addressText: "",
    lat: 0,
    lng: 0,
  });
  const [dropoff, setDropoff] = useState<LocationValue>({
    addressText: "",
    lat: 0,
    lng: 0,
  });

  const seePrices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/estimate/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupAddress: pickup.addressText,
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropoffAddress: dropoff.addressText,
          dropoffLat: dropoff.lat,
          dropoffLng: dropoff.lng,
        }),
      });

      if (response.status === 401) {
        router.push("/auth?next=/");
        return;
      }

      const data = (await response.json()) as { draftId?: string; error?: string };
      if (!response.ok || !data.draftId) {
        throw new Error(data.error || "Unable to start estimate");
      }

      router.push(`/estimate/${data.draftId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start estimate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <Card className="overflow-hidden border-primary/10">
        <CardContent className="grid gap-8 p-6 md:grid-cols-[1.15fr_1fr] md:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" />
              Customer-only booking flow
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Move smarter with transparent pricing from Smoove.
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground md:text-base">
              Enter your addresses, compare vehicles, see live route ETA and miles, then book in minutes with Stripe.
            </p>

            <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pickup</p>
                <AddressAutocomplete
                  value={pickup.addressText}
                  onChange={(value) => setPickup((current) => ({ ...current, addressText: value }))}
                  onSelect={(value) =>
                    setPickup({
                      addressText: value.label,
                      lat: value.lat,
                      lng: value.lng,
                    })
                  }
                  placeholder="Where are we picking up?"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dropoff</p>
                <AddressAutocomplete
                  value={dropoff.addressText}
                  onChange={(value) => setDropoff((current) => ({ ...current, addressText: value }))}
                  onSelect={(value) =>
                    setDropoff({
                      addressText: value.label,
                      lat: value.lat,
                      lng: value.lng,
                    })
                  }
                  placeholder="Where are we heading?"
                />
              </div>
              <Button className="w-full" onClick={seePrices} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPinned className="mr-2 h-4 w-4" />}
                See prices
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    How estimates work
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Transparent estimate model</DialogTitle>
                    <DialogDescription>
                      Activation fee applies once. Labor beyond included minutes, travel time, mileage, and add-ons are all shown before checkout.
                    </DialogDescription>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Most moves receive a confidence range based on item mix, stairs, and stop complexity. Final cost depends on actual on-site time.
                  </p>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-violet-100 via-white to-indigo-100 p-6">
            <h2 className="mb-3 text-lg font-semibold">Why people pick Smoove</h2>
            <ul className="space-y-3 text-sm text-slate-700">
              <li>• Route-aware pricing that updates instantly.</li>
              <li>• Full estimate breakdown before checkout.</li>
              <li>• Secure SMS sign-in and payment confirmation.</li>
              <li>• Track your move status live after booking.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Compare Smoove vehicle tiers</h2>
          <p className="text-sm text-muted-foreground">
            Original Smoove fleet artwork with dimensions and transparent rates.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier) => (
            <Card key={tier.id} className="h-full">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <CardDescription>{tier.subtitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <VehicleIllustration vehicleType={tier.vehicleType} className="h-28 w-full" />
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Activation fee</dt>
                    <dd>{centsToCurrency(tier.activationFeeCents)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Labor after included</dt>
                    <dd>{centsToCurrency(tier.laborRateCentsPerMin)}/min</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Travel rate</dt>
                    <dd>{centsToCurrency(tier.travelRateCentsPerMin)}/min</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Mileage</dt>
                    <dd>{centsToCurrency(tier.mileageRateCentsPerMile)}/mile</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
