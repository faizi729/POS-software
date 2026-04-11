import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import "./globals.css";
import { UnhandledErrorsListener } from "@/components/utils/unhandled-errors-listener";
import { RouteTransitionOverlay } from "@/components/utils/route-transition-overlay";
import { ToastViewport } from "@/components/utils/toast-viewport";
import { RestaurantConfigBootstrap } from "@/components/utils/restaurant-config-bootstrap";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "Rasoio",
  description: "Modern multi-tenant restaurant POS system",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full overflow-x-clip">
      <body
        className={`${manrope.variable} min-h-screen w-full max-w-full overflow-x-clip antialiased`}
      >
        <UnhandledErrorsListener />
        <RestaurantConfigBootstrap />
        <RouteTransitionOverlay />
        <ToastViewport />
        {children}
      </body>
    </html>
  );
}
