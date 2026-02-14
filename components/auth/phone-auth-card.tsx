"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquareText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  nextPath?: string;
};

export function PhoneAuthCard({ nextPath = "/dashboard" }: Props) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [loading, setLoading] = useState(false);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const resendSeconds = useMemo(() => {
    if (!resendAt) return 0;
    return Math.max(0, Math.ceil((resendAt - clock) / 1000));
  }, [clock, resendAt]);

  const sendCode = async (resend = false) => {
    try {
      setLoading(true);
      const endpoint = resend ? "/api/auth/otp/resend" : "/api/auth/otp/send";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to send code");
      }
      setStep("verify");
      setResendAt(Date.now() + 30_000);
      toast.success(resend ? "Code resent" : "Code sent via SMS");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to verify code");
      }
      toast.success("You are signed in.");
      router.push(nextPath);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Sign in with your phone
        </CardTitle>
        <CardDescription>
          Enter your number and we will text a secure 6-digit code using Twilio Verify.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone number (E.164)</Label>
          <Input
            id="phone"
            placeholder="+14155550123"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={loading || step === "verify"}
            autoComplete="tel"
          />
        </div>

        {step === "verify" ? (
          <div className="space-y-2">
            <Label htmlFor="code">6-digit code</Label>
            <Input
              id="code"
              inputMode="numeric"
              pattern="\d{6}"
              placeholder="123456"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              disabled={loading}
              autoComplete="one-time-code"
            />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {step === "phone" ? (
            <Button onClick={() => sendCode(false)} disabled={loading || phone.length < 8}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquareText className="mr-2 h-4 w-4" />}
              Send code
            </Button>
          ) : (
            <>
              <Button onClick={verifyCode} disabled={loading || code.length !== 6}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Verify & continue
              </Button>
              <Button
                variant="outline"
                onClick={() => sendCode(true)}
                disabled={loading || resendSeconds > 0}
              >
                Resend code {resendSeconds > 0 ? `(${resendSeconds}s)` : ""}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
