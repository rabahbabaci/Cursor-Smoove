import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SuccessPageProps = {
  searchParams: { session_id?: string };
};

export default function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-violet-50 to-white p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            Payment submitted
          </CardTitle>
          <CardDescription>
            Your booking is being finalized. Webhook confirmation may take a few seconds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {searchParams.session_id ? (
            <p className="rounded-xl border bg-muted/50 p-3 text-xs text-muted-foreground">
              Stripe session: {searchParams.session_id}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button>Go to dashboard</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Back home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
