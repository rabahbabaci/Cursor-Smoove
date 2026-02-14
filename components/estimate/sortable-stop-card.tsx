"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Trash2 } from "lucide-react";
import { type Control, Controller } from "react-hook-form";

import { AddressAutocomplete } from "@/components/map/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type EstimateDraftInput } from "@/lib/validation/estimate";

type SortableStopCardProps = {
  itemId: string;
  index: number;
  totalStops: number;
  control: Control<EstimateDraftInput>;
  onRemove: () => void;
  onAddressSelect: (index: number, value: { label: string; lat: number; lng: number }) => void;
  canRemove: boolean;
};

function getTitle(index: number, totalStops: number) {
  if (index === 0) return "Pickup";
  if (index === totalStops - 1) return "Dropoff";
  return `Stop ${index}`;
}

export function SortableStopCard({
  itemId,
  index,
  totalStops,
  control,
  onRemove,
  onAddressSelect,
  canRemove,
}: SortableStopCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemId,
  });

  return (
    <Card
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "opacity-80" : ""}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{getTitle(index, totalStops)}</CardTitle>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl border p-2 text-muted-foreground hover:bg-muted"
              {...attributes}
              {...listeners}
              aria-label={`Reorder ${getTitle(index, totalStops)}`}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            {canRemove ? (
              <Button variant="outline" size="icon" onClick={onRemove} aria-label="Remove stop">
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Address</Label>
          <Controller
            control={control}
            name={`stops.${index}.addressText`}
            render={({ field }) => (
              <AddressAutocomplete
                value={field.value}
                onChange={field.onChange}
                onSelect={(value) => onAddressSelect(index, value)}
                placeholder={
                  index === 0 ? "Pickup address" : index === totalStops - 1 ? "Dropoff address" : "Stop address"
                }
              />
            )}
          />
        </div>
        <div>
          <Label>Unit number</Label>
          <Controller
            control={control}
            name={`stops.${index}.unit`}
            render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Optional" />}
          />
        </div>
        <div>
          <Label>Gate code</Label>
          <Controller
            control={control}
            name={`stops.${index}.gateCode`}
            render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Optional" />}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Parking instructions</Label>
          <Controller
            control={control}
            name={`stops.${index}.parkingNotes`}
            render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Street parking, loading zone, etc." />}
          />
        </div>
        <div>
          <Label>Stairs flights</Label>
          <Controller
            control={control}
            name={`stops.${index}.stairsFlights`}
            render={({ field }) => (
              <Input
                type="number"
                min={0}
                max={10}
                value={field.value ?? 0}
                onChange={(event) => field.onChange(Number(event.target.value))}
              />
            )}
          />
        </div>
        <div>
          <Label>Contact phone (optional)</Label>
          <Controller
            control={control}
            name={`stops.${index}.contactPhoneOptional`}
            render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="+14155550123" />}
          />
        </div>
      </CardContent>
    </Card>
  );
}
