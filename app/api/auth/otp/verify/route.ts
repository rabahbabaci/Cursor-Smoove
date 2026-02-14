import { NextResponse } from "next/server";

import { createSessionToken } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getTwilioClient } from "@/lib/twilio";
import { verifyCodeSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, code } = verifyCodeSchema.parse(body);

    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (!serviceSid) {
      return NextResponse.json({ error: "TWILIO_VERIFY_SERVICE_SID is missing" }, { status: 500 });
    }

    const twilio = getTwilioClient();
    const verification = await twilio.verify.v2.services(serviceSid).verificationChecks.create({
      to: phone,
      code,
    });

    if (verification.status !== "approved") {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
    }

    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    const token = await createSessionToken({
      sub: user.id,
      phone: user.phone,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: "smoove_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify code";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
