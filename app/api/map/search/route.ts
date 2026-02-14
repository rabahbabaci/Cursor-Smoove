import { NextResponse } from "next/server";
import { z } from "zod";

import { searchAddress } from "@/lib/mapbox";

const schema = z.object({
  q: z.string().min(2),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { q } = schema.parse({
      q: url.searchParams.get("q"),
    });

    const results = await searchAddress(q);
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to search addresses";
    return NextResponse.json({ error: message, results: [] }, { status: 400 });
  }
}
