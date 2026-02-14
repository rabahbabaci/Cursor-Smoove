"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { type PricingConfig, type VehicleTier, type VehicleType } from "@prisma/client";
import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { cancelEstimateAction, saveEstimateDraftAction } from "@/lib/actions/estimate";
import { UploadButton } from "@/lib/uploadthing-client";
import { calculateEstimate } from "@/lib/pricing";
import { estimateDraftSchema, type EstimateDraftInput } from "@/lib/validation/estimate";
import { RouteMap } from "@/components/map/route-map";
import { PricingBreakdown } from "@/components/estimate/pricing-breakdown";
import { SortableStopCard } from "@/components/estimate/sortable-stop-card";
import { WizardStepper, type WizardStepId, wizardSteps } from "@/components/estimate/stepper";
import { VehicleCard } from "@/components/estimate/vehicle-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { centsToCurrency } from "@/lib/utils";

type DraftStop = {
  id: string;
  order: number;
  addressText: string;
  lat: number;
  lng: number;
  unit: string | null;
  gateCode: string | null;
  parkingNotes: string | null;
  stairsFlights: number;
  contactPhoneOptional: string | null;
};

type DraftItem = {
  id: string;
  name: string;
  qty: number;
  isHeavy: boolean;
  isBulky: boolean;
  requiresAssembly: boolean;
  notes: string | null;
};

type DraftPhoto = {
  id: string;
  url: string;
};

type DraftBookingPayload = {
  id: string;
  vehicleType: VehicleType | null;
  scheduleType: "ON_DEMAND" | "SCHEDULED" | null;
  scheduledAt: string | null;
  pickupWindowStart: string | null;
  pickupWindowEnd: string | null;
  additionalNotes: string | null;
  onDemandEtaMin: number | null;
  onDemandEtaMax: number | null;
  routeDistanceMeters: number | null;
  routeDurationMinutes: number | null;
  stops: DraftStop[];
  items: DraftItem[];
  photos: DraftPhoto[];
};

type EstimateWizardProps = {
  draft: DraftBookingPayload;
  tiers: VehicleTier[];
  config: PricingConfig;
};

const stepSchema = z.enum(wizardSteps.map((step) => step.id) as [WizardStepId, ...WizardStepId[]]);

const emptyItem = {
  name: "",
  qty: 1,
  isHeavy: false,
  isBulky: false,
  requiresAssembly: false,
  notes: "",
};

const emptyStop = {
  addressText: "",
  lat: 0,
  lng: 0,
  unit: "",
  gateCode: "",
  parkingNotes: "",
  stairsFlights: 0,
  contactPhoneOptional: "",
};

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function toISOStringOrEmpty(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

export function EstimateWizard({ draft, tiers, config }: EstimateWizardProps) {
  const [activeStep, setActiveStep] = useState<WizardStepId>("addresses");
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [saving, startSaving] = useTransition();
  const [checkingOut, setCheckingOut] = useState(false);

  const form = useForm<EstimateDraftInput>({
    resolver: zodResolver(estimateDraftSchema),
    defaultValues: {
      draftId: draft.id,
      vehicleType: draft.vehicleType ?? "SWIFT",
      scheduleType: draft.scheduleType ?? "ON_DEMAND",
      scheduledAt: draft.scheduledAt ?? "",
      pickupWindowStart: draft.pickupWindowStart ?? "",
      pickupWindowEnd: draft.pickupWindowEnd ?? "",
      additionalNotes: draft.additionalNotes ?? "",
      onDemandEtaMin: draft.onDemandEtaMin ?? 30,
      onDemandEtaMax: draft.onDemandEtaMax ?? 90,
      routeDistanceMeters: draft.routeDistanceMeters ?? 0,
      routeDurationMinutes: draft.routeDurationMinutes ?? 0,
      stops:
        draft.stops.length > 0
          ? [...draft.stops]
              .sort((a, b) => a.order - b.order)
              .map((stop) => ({
                id: stop.id,
                addressText: stop.addressText,
                lat: stop.lat,
                lng: stop.lng,
                unit: stop.unit ?? "",
                gateCode: stop.gateCode ?? "",
                parkingNotes: stop.parkingNotes ?? "",
                stairsFlights: stop.stairsFlights,
                contactPhoneOptional: stop.contactPhoneOptional ?? "",
              }))
          : [
              { ...emptyStop, addressText: "Pickup address" },
              { ...emptyStop, addressText: "Dropoff address" },
            ],
      items:
        draft.items.length > 0
          ? draft.items.map((item) => ({
              id: item.id,
              name: item.name,
              qty: item.qty,
              isHeavy: item.isHeavy,
              isBulky: item.isBulky,
              requiresAssembly: item.requiresAssembly,
              notes: item.notes ?? "",
            }))
          : [],
      photos: draft.photos.map((photo) => photo.url),
    },
  });

  const {
    fields: stopFields,
    insert: insertStop,
    remove: removeStop,
    move: moveStop,
  } = useFieldArray({
    control: form.control,
    name: "stops",
    keyName: "fieldKey",
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "items",
    keyName: "fieldKey",
  });

  const stops = useWatch({ control: form.control, name: "stops" });
  const items = useWatch({ control: form.control, name: "items" });
  const photos = useWatch({ control: form.control, name: "photos" });
  const vehicleType = useWatch({ control: form.control, name: "vehicleType" });
  const scheduleType = useWatch({ control: form.control, name: "scheduleType" });
  const routeDistanceMeters = useWatch({ control: form.control, name: "routeDistanceMeters" });
  const routeDurationMinutes = useWatch({ control: form.control, name: "routeDurationMinutes" });
  const onDemandEtaMin = useWatch({ control: form.control, name: "onDemandEtaMin" });
  const onDemandEtaMax = useWatch({ control: form.control, name: "onDemandEtaMax" });

  const selectedVehicle = useMemo(() => {
    return tiers.find((tier) => tier.vehicleType === vehicleType) ?? tiers[0];
  }, [tiers, vehicleType]);

  const pricingBreakdown = useMemo(() => {
    return calculateEstimate({
      vehicle: selectedVehicle,
      config,
      routeDistanceMiles: routeDistanceMeters / 1609.34,
      routeDurationMinutes,
      stopCount: stops.length,
      stairsFlightsByLocation: stops.map((stop) => stop.stairsFlights),
      items: items.map((item) => ({
        qty: item.qty,
        isHeavy: item.isHeavy,
        isBulky: item.isBulky,
        requiresAssembly: item.requiresAssembly,
      })),
    });
  }, [config, items, routeDistanceMeters, routeDurationMinutes, selectedVehicle, stops]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const mapStops = useMemo(
    () =>
      stops.map((stop, index) => ({
        id: stop.id ?? `stop-${index}`,
        label: stop.addressText,
        lat: stop.lat,
        lng: stop.lng,
      })),
    [stops],
  );

  const routeFetchPoints = useMemo(
    () =>
      stops
        .map((stop) => ({ lat: stop.lat, lng: stop.lng }))
        .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng) && !(point.lat === 0 && point.lng === 0)),
    [stops],
  );

  useEffect(() => {
    const controller = new AbortController();
    const fetchRoute = async () => {
      if (routeFetchPoints.length < 2) {
        setRouteGeometry([]);
        form.setValue("routeDistanceMeters", 0);
        form.setValue("routeDurationMinutes", 0);
        return;
      }
      try {
        const response = await fetch("/api/map/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ points: routeFetchPoints }),
        });
        const data = (await response.json()) as {
          geometry?: [number, number][];
          distanceMeters?: number;
          durationMinutes?: number;
        };
        if (!response.ok || !data.geometry) {
          return;
        }
        setRouteGeometry(data.geometry);
        form.setValue("routeDistanceMeters", Math.round(data.distanceMeters ?? 0), { shouldDirty: true });
        form.setValue("routeDurationMinutes", Math.round(data.durationMinutes ?? 0), { shouldDirty: true });
      } catch {
        setRouteGeometry([]);
      }
    };
    void fetchRoute();
    return () => controller.abort();
  }, [form, routeFetchPoints]);

  const persistDraft = async () => {
    const values = form.getValues();
    const payload = estimateDraftSchema.parse(values);
    return saveEstimateDraftAction(payload);
  };

  const handleSaveAndStep = (nextStep: WizardStepId) => {
    startSaving(() => {
      persistDraft()
        .then(() => {
          toast.success("Estimate saved");
          setActiveStep(nextStep);
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : "Unable to save estimate");
        });
    });
  };

  const goNext = () => {
    const index = wizardSteps.findIndex((step) => step.id === activeStep);
    const next = wizardSteps[index + 1]?.id;
    if (!next) return;
    handleSaveAndStep(next);
  };

  const goBack = () => {
    const index = wizardSteps.findIndex((step) => step.id === activeStep);
    const previous = wizardSteps[index - 1]?.id;
    if (!previous) return;
    setActiveStep(previous);
  };

  const handleCancelEstimate = async () => {
    startSaving(() => {
      cancelEstimateAction(draft.id)
        .then(() => {
          window.location.href = "/";
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : "Unable to cancel estimate");
        });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = stopFields.findIndex((field) => field.fieldKey === String(active.id));
    const newIndex = stopFields.findIndex((field) => field.fieldKey === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    moveStop(oldIndex, newIndex);
  };

  const handleCheckout = async () => {
    try {
      setCheckingOut(true);
      await persistDraft();
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: draft.id }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout");
      }
      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to continue to checkout");
      setCheckingOut(false);
    }
  };

  const stepContent = () => {
    if (activeStep === "addresses") {
      return (
        <div className="space-y-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={stopFields.map((field) => field.fieldKey)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {stopFields.map((field, index) => (
                  <SortableStopCard
                    key={field.fieldKey}
                    itemId={field.fieldKey}
                    index={index}
                    totalStops={stopFields.length}
                    control={form.control}
                    canRemove={stopFields.length > 2}
                    onAddressSelect={(stopIndex, value) => {
                      form.setValue(`stops.${stopIndex}.addressText`, value.label);
                      form.setValue(`stops.${stopIndex}.lat`, value.lat);
                      form.setValue(`stops.${stopIndex}.lng`, value.lng);
                    }}
                    onRemove={() => removeStop(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button
            variant="outline"
            onClick={() => {
              if (stopFields.length >= 7) return;
              insertStop(Math.max(1, stopFields.length - 1), { ...emptyStop });
            }}
            disabled={stopFields.length >= 7}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add stop ({Math.max(0, 7 - stopFields.length)} remaining)
          </Button>
        </div>
      );
    }

    if (activeStep === "vehicle") {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {tiers.map((tier) => (
            <VehicleCard
              key={tier.id}
              tier={tier}
              selected={vehicleType === tier.vehicleType}
              onSelect={(type) => form.setValue("vehicleType", type, { shouldDirty: true })}
              onContinue={(type) => {
                form.setValue("vehicleType", type, { shouldDirty: true });
                handleSaveAndStep("items");
              }}
            />
          ))}
        </div>
      );
    }

    if (activeStep === "items") {
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Items list</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {itemFields.map((field, index) => (
                <div key={field.fieldKey} className="rounded-2xl border p-3">
                  <div className="grid gap-3 md:grid-cols-[1fr_120px_auto]">
                    <Controller
                      control={form.control}
                      name={`items.${index}.name`}
                      render={({ field: itemField }) => <Input {...itemField} placeholder="Item name" />}
                    />
                    <Controller
                      control={form.control}
                      name={`items.${index}.qty`}
                      render={({ field: itemField }) => (
                        <Input
                          type="number"
                          min={1}
                          value={itemField.value}
                          onChange={(event) => itemField.onChange(Number(event.target.value))}
                        />
                      )}
                    />
                    <Button variant="outline" onClick={() => removeItem(index)}>
                      Remove
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <Controller
                        control={form.control}
                        name={`items.${index}.isHeavy`}
                        render={({ field: itemField }) => (
                          <Checkbox checked={itemField.value} onCheckedChange={(checked) => itemField.onChange(Boolean(checked))} />
                        )}
                      />
                      <Label>Heavy</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Controller
                        control={form.control}
                        name={`items.${index}.isBulky`}
                        render={({ field: itemField }) => (
                          <Checkbox checked={itemField.value} onCheckedChange={(checked) => itemField.onChange(Boolean(checked))} />
                        )}
                      />
                      <Label>Bulky</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Controller
                        control={form.control}
                        name={`items.${index}.requiresAssembly`}
                        render={({ field: itemField }) => (
                          <Checkbox checked={itemField.value} onCheckedChange={(checked) => itemField.onChange(Boolean(checked))} />
                        )}
                      />
                      <Label>Assembly</Label>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Controller
                      control={form.control}
                      name={`items.${index}.notes`}
                      render={({ field: itemField }) => (
                        <Input {...itemField} value={itemField.value ?? ""} placeholder="Optional note (fragile, boxed, etc.)" />
                      )}
                    />
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={() => appendItem({ ...emptyItem })}>
                <Plus className="mr-2 h-4 w-4" />
                Add item
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Photos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <UploadButton
                endpoint="bookingPhotos"
                onClientUploadComplete={(results) => {
                  const existing = form.getValues("photos");
                  form.setValue(
                    "photos",
                    [...existing, ...results.map((result) => result.url)],
                    { shouldDirty: true },
                  );
                  toast.success(`${results.length} photo(s) uploaded`);
                }}
                onUploadError={(error: Error) => {
                  toast.error(error.message);
                }}
                appearance={{
                  button:
                    "ut-ready:bg-smoove-gradient ut-uploading:cursor-not-allowed ut-uploading:opacity-70 ut-button:bg-smoove-gradient",
                  container: "w-full",
                }}
              />

              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {photos.map((photo, index) => (
                  <div key={`${photo}-${index}`} className="group relative overflow-hidden rounded-xl border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt={`Uploaded item ${index + 1}`} className="h-28 w-full object-cover" />
                    <button
                      type="button"
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                      onClick={() => {
                        form.setValue(
                          "photos",
                          photos.filter((_, photoIndex) => photoIndex !== index),
                          { shouldDirty: true },
                        );
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Special instructions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Pickup unit number</Label>
                <Controller
                  control={form.control}
                  name="stops.0.unit"
                  render={({ field }) => <Input {...field} value={field.value ?? ""} />}
                />
              </div>
              <div>
                <Label>Dropoff unit number</Label>
                <Controller
                  control={form.control}
                  name={`stops.${Math.max(1, stops.length - 1)}.unit`}
                  render={({ field }) => <Input {...field} value={field.value ?? ""} />}
                />
              </div>
              <div>
                <Label>Pickup gate code</Label>
                <Controller
                  control={form.control}
                  name="stops.0.gateCode"
                  render={({ field }) => <Input {...field} value={field.value ?? ""} />}
                />
              </div>
              <div>
                <Label>Dropoff gate code</Label>
                <Controller
                  control={form.control}
                  name={`stops.${Math.max(1, stops.length - 1)}.gateCode`}
                  render={({ field }) => <Input {...field} value={field.value ?? ""} />}
                />
              </div>
              <div>
                <Label>Pickup parking instructions</Label>
                <Controller
                  control={form.control}
                  name="stops.0.parkingNotes"
                  render={({ field }) => <Textarea {...field} value={field.value ?? ""} />}
                />
              </div>
              <div>
                <Label>Dropoff parking instructions</Label>
                <Controller
                  control={form.control}
                  name={`stops.${Math.max(1, stops.length - 1)}.parkingNotes`}
                  render={({ field }) => <Textarea {...field} value={field.value ?? ""} />}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Additional notes</Label>
                <Controller
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => <Textarea {...field} value={field.value ?? ""} />}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeStep === "schedule") {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schedule your move</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs
              value={scheduleType}
              onValueChange={(value) => form.setValue("scheduleType", value as "ON_DEMAND" | "SCHEDULED")}
            >
              <TabsList>
                <TabsTrigger value="ON_DEMAND">On-demand</TabsTrigger>
                <TabsTrigger value="SCHEDULED">Scheduled</TabsTrigger>
              </TabsList>
            </Tabs>

            {scheduleType === "ON_DEMAND" ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">Crew ETA range</p>
                <Badge className="mt-2">
                  {onDemandEtaMin}-{onDemandEtaMax} minutes
                </Badge>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>ETA minimum (minutes)</Label>
                    <Controller
                      control={form.control}
                      name="onDemandEtaMin"
                      render={({ field }) => (
                        <Input
                          type="number"
                          min={10}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Label>ETA maximum (minutes)</Label>
                    <Controller
                      control={form.control}
                      name="onDemandEtaMax"
                      render={({ field }) => (
                        <Input
                          type="number"
                          min={20}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label>Date + start time</Label>
                  <Controller
                    control={form.control}
                    name="scheduledAt"
                    render={({ field }) => (
                      <Input
                        type="datetime-local"
                        value={toDateTimeLocal(field.value)}
                        onChange={(event) => field.onChange(toISOStringOrEmpty(event.target.value))}
                      />
                    )}
                  />
                </div>
                <div>
                  <Label>Time window start</Label>
                  <Controller
                    control={form.control}
                    name="pickupWindowStart"
                    render={({ field }) => (
                      <Input
                        type="datetime-local"
                        value={toDateTimeLocal(field.value)}
                        onChange={(event) => field.onChange(toISOStringOrEmpty(event.target.value))}
                      />
                    )}
                  />
                </div>
                <div>
                  <Label>Time window end</Label>
                  <Controller
                    control={form.control}
                    name="pickupWindowEnd"
                    render={({ field }) => (
                      <Input
                        type="datetime-local"
                        value={toDateTimeLocal(field.value)}
                        onChange={(event) => field.onChange(toISOStringOrEmpty(event.target.value))}
                      />
                    )}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    if (activeStep === "pricing") {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transparent pricing review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PricingBreakdown breakdown={pricingBreakdown} />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Checkout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">Total estimate</p>
            <p className="text-3xl font-bold">{centsToCurrency(pricingBreakdown.totalEstimateCents)}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Most moves like this cost {centsToCurrency(pricingBreakdown.confidenceLowCents)} -{" "}
              {centsToCurrency(pricingBreakdown.confidenceHighCents)}
            </p>
          </div>
          <PricingBreakdown breakdown={pricingBreakdown} />
          <Button className="w-full" onClick={handleCheckout} disabled={checkingOut || saving}>
            {checkingOut ? "Redirecting to Stripe..." : "Proceed to Stripe Checkout"}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
        <div>
          <h1 className="text-2xl font-semibold">Estimate wizard</h1>
          <p className="text-sm text-muted-foreground">Draft #{draft.id.slice(0, 8)}</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-destructive">
              Cancel estimate
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this estimate?</AlertDialogTitle>
              <AlertDialogDescription>
                This clears your draft and returns you home.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep estimate</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelEstimate}>Yes, cancel estimate</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <WizardStepper
        activeStep={stepSchema.parse(activeStep)}
        onStepSelect={(step) => {
          setActiveStep(step);
        }}
      />

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-4">
          {stepContent()}
          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="outline" onClick={goBack} disabled={activeStep === "addresses"}>
              Back
            </Button>
            <Button onClick={goNext} disabled={activeStep === "checkout" || saving || checkingOut}>
              {saving ? "Saving..." : activeStep === "pricing" ? "Continue to checkout" : "Save & continue"}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Route map</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RouteMap stops={mapStops} routeCoordinates={routeGeometry} className="h-[300px]" />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-semibold">{(routeDistanceMeters / 1609.34).toFixed(1)} miles</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">ETA</p>
                  <p className="font-semibold">{Math.round(routeDurationMinutes)} min</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <PricingBreakdown breakdown={pricingBreakdown} />
        </div>
      </div>
    </div>
  );
}
