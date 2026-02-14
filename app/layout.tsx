import type { Metadata } from "next";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Smoove | Customer moving app",
  description:
    "Book customer-facing moves with live map routing, transparent pricing, and secure checkout.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
