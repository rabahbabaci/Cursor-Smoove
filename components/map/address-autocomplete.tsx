"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Suggestion = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

type AddressAutocompleteProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: Suggestion) => void;
  className?: string;
  disabled?: boolean;
};

export function AddressAutocomplete({
  placeholder,
  value,
  onChange,
  onSelect,
  className,
  disabled,
}: AddressAutocompleteProps) {
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const showList = focused && results.length > 0;

  useEffect(() => {
    const controller = new AbortController();
    const trimmed = value.trim();

    if (trimmed.length < 3) {
      setResults([]);
      return () => controller.abort();
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/map/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setResults([]);
          return;
        }
        const data = (await response.json()) as { results: Suggestion[] };
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [value]);

  const noResults = useMemo(
    () => focused && !loading && value.trim().length >= 3 && results.length === 0,
    [focused, loading, value, results.length],
  );

  return (
    <div className={cn("relative", className)}>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        disabled={disabled}
      />
      {loading ? <Loader2 className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-muted-foreground" /> : null}
      {showList ? (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border bg-white p-1 shadow-lg">
          {results.map((result) => (
            <button
              type="button"
              key={result.id}
              onMouseDown={() => {
                onChange(result.label);
                onSelect(result);
                setResults([]);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <MapPin className="h-4 w-4 text-primary" />
              <span>{result.label}</span>
            </button>
          ))}
        </div>
      ) : null}
      {noResults ? (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border bg-white px-3 py-2 text-sm text-muted-foreground shadow-lg">
          No matching addresses found
        </div>
      ) : null}
    </div>
  );
}
