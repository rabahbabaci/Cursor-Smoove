"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function AuthNav({ phone }: { phone: string }) {
  const router = useRouter();

  const logout = async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      toast.error("Unable to sign out right now");
      return;
    }
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3">
      <p className="hidden text-sm text-muted-foreground md:block">{phone}</p>
      <Button variant="outline" size="sm" onClick={logout}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}
