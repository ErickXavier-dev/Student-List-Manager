import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Class Money Manager",
  description: "Premium Student Payment Tracking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="mesh-bg" />
        <Navbar />
        <main className="pt-24 min-h-screen px-4 pb-12 max-w-7xl mx-auto">
          {children}
        </main>
        <Toaster position="bottom-right" theme="dark" richColors />
      </body>
    </html>
  );
}
