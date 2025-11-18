import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense, memo } from "react";
import dynamic from "next/dynamic";
const BackgroundScene = dynamic(() => import("./BackgroundScene"), { ssr: true, loading: () => logo });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pockit Game Corp",
  description: "Independent game studio building games using AI and blockchain technology.",
  openGraph: {
    type: 'website',
    title: 'Pockit Game Corp',
    description: 'Independent game studio building games using AI and blockchain technology.',
    url: 'https://pockit.world',
    images: 'https://pockit.world/ui/pockitlogo.png',
  },
  twitter: {
    card: 'player',
    title: 'Pockit Game Corp',
    description: 'Independent game studio on Ethereum.',
    creator: '@pockitmilady',
    images: ["https://pockit.world/ui/pockitlogo.png"],
  }
};

export const viewport: Viewport = {
  width: "device-width",
  viewportFit: "cover",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
}

const logo = <img src='/ui/pockitlogo2.png' className="absolute w-64 h-64 top-1/2 left-1/2 -translate-1/2 animate-pulse" />;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={logo}>
          <BackgroundScene key="background-scene" />
        </Suspense>

        {children}
      </body>
    </html>
  );
}