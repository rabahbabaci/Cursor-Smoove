import Link from "next/link";

import { SmooveLogo } from "@/components/brand/smoove-logo";
import { AuthNav } from "@/components/auth/auth-nav";
import { HomeHero } from "@/components/home/home-hero";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { getVehicleTiers } from "@/lib/data/pricing";

export default async function HomePage() {
  const [tiers, user] = await Promise.all([getVehicleTiers(), getSessionUser()]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50/50 via-white to-white px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white px-4 py-3 shadow-sm">
          <Link href="/">
            <SmooveLogo />
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
            {user ? (
              <AuthNav phone={user.phone} />
            ) : (
              <Link href="/auth">
                <Button size="sm">Sign in</Button>
              </Link>
            )}
          </nav>
        </header>

        <HomeHero tiers={tiers} />
      </div>
    </main>
  );
}
