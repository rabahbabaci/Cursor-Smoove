import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: "smoove_session",
    value: "",
    path: "/",
    expires: new Date(0),
  });
  return response;
}
