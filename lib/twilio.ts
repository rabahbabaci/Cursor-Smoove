import Twilio from "twilio";

let twilioClient: Twilio | null = null;

export function getTwilioClient() {
  if (twilioClient) {
    return twilioClient;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials are not configured.");
  }

  twilioClient = Twilio(accountSid, authToken);
  return twilioClient;
}
