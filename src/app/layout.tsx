import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PockitLogo from "./ui/PockitLogo";
import ScrollerUI from "./ui/Scroller";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "optional",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Pockit Game Corp",
  description: "Independent game studio building perpetual games using blockchain technology.",
  openGraph: {
    type: 'website',
    title: 'Pockit Game Corp',
    description: 'Independent game studio building perpetual games using blockchain technology.',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased !text-black`}
      >
        <div className="flex h-dvh flex-col overflow-hidden bg-[#e4e7ed]">
          <header className="relative z-10 shrink-0 bg-red-500 w-full flex flex-col items-center select-none">
            <div className="w-full">
              <ScrollerUI />
            </div>
            <div className="bg-blue-600 w-full text-black relative h-8 px-2 flex items-center gap-4 uppercase text-white font-mono font-medium">
              <div className="fixed top-2 left-1/2 -translate-x-1/2 h-0">
                <PockitLogo />
              </div>
              <Link href="/" className="hover:text-yellow-300 hover:font-black cursor-pointer">Home</Link>
              <Link href="/about" className="hover:text-yellow-300 hover:font-black cursor-pointer">About</Link>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex h-full flex-col items-center [&>*]:shrink-0">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
