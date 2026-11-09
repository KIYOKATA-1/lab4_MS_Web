import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Eco Monitor — Weather & Air Quality",
  description: "Weather and air quality in one place. Explore environmental conditions in your city with Eco Monitor.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
