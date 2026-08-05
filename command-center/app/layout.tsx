import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workora Command Center",
  description: "See the whole company live: who's working, what's shipping, what's blocked.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable} style={{ background: "#000" }}>
      <body style={{ background: "#000", color: "#EBEBEB" }}>{children}</body>
    </html>
  );
}
