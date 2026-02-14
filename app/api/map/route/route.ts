import { NextResponse } from "next/server";
import { z } from "zod";

import { getRoute } from "@/lib/mapbox";

const bodySchema = z.object({
  points: z
    .array(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      }),
    )
    .min(2),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.parse(body);
    const route = await getRoute(parsed.points);
    if (!route) {
      return NextResponse.json({ error: "No route found" }, { status: 404 });
    }
    return NextResponse.json(route);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch route";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
