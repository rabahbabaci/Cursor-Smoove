import { NextResponse } from "next/server";

import { getTwilioClient } from "@/lib/twilio";
import { phoneSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = phoneSchema.parse(body);

    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (!serviceSid) {
      return NextResponse.json({ error: "TWILIO_VERIFY_SERVICE_SID is missing" }, { status: 500 });
    }

    const twilio = getTwilioClient();
    await twilio.verify.v2.services(serviceSid).verifications.create({
      to: phone,
      channel: "sms",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send verification code";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
