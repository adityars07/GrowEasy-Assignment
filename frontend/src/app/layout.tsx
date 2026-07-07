import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GrowEasy CSV Importer | AI-Powered CRM Data Import",
  description:
    "Upload any CSV file and let AI intelligently map your data into GrowEasy CRM format. Supports Facebook Lead Ads, Google Ads, Excel exports, and more.",
  keywords: ["CSV importer", "CRM", "AI", "data mapping", "GrowEasy", "lead import"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
