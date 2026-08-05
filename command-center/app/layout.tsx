import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workora Command Center",
  description: "See the whole company live: who's working, what's shipping, what's blocked.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ background: "#0c0a09" }}>
      <body style={{ background: "#0c0a09", color: "#e7e5e4" }}>{children}</body>
    </html>
  );
}
