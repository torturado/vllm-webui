import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "vLLM Web UI",
  description: "Terminal-style interface for vLLM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-mono">{children}</body>
    </html>
  );
}
