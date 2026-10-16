import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Nature Club | Outdoor Adventures & Conservation",
  description:
    "Join the Nature Club for hiking, bird watching, tree planting, clean-up campaigns, wilderness camping, and environmental stewardship.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 antialiased selection:bg-emerald-200 selection:text-emerald-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
