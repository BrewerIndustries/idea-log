import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Idea Log",
  description: "A running log of product, project, and game ideas — captured, tagged, and fleshed out.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
