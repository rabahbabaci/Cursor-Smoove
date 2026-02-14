import Link from "next/link";

import { SmooveLogo } from "@/components/brand/smoove-logo";
import { PhoneAuthCard } from "@/components/auth/phone-auth-card";

type AuthPageProps = {
  searchParams: { next?: string };
};

export default function AuthPage({ searchParams }: AuthPageProps) {
  const nextPath = searchParams.next && searchParams.next.startsWith("/") ? searchParams.next : "/dashboard";

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 to-white px-4 py-16">
      <div className="mx-auto mb-8 max-w-xl text-center">
        <SmooveLogo className="mb-5 inline-flex" />
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome to Smoove</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Fast, transparent moving estimates with real-time route-aware pricing.
        </p>
      </div>
      <PhoneAuthCard nextPath={nextPath} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Need a new estimate first?{" "}
        <Link href="/" className="font-medium text-primary hover:underline">
          Go to home
        </Link>
      </p>
    </main>
  );
}
