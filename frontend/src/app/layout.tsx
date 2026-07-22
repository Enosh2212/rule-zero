import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rule Zero",
  description: "A pre-action security layer for autonomous AI agents.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
