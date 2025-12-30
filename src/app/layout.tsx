import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
import PockitLogo from "./ui/PockitLogo";
import ScrollerUI from "./ui/Scroller";
import Link from "next/link";

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

const logo = <img src='/ui/pockitlogo2.png' className="absolute w-64 h-64 top-1/2 left-1/2 -translate-1/2 animate-pulse" />;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col items-center pt-40 !bg-[#f0f0f0] dark:!bg-[#1a1a1a] min-h-screen`}
      >
        <div className="absolute top-0 bg-red-500 w-screen flex flex-col select-none">
          <div className="w-full">
            <ScrollerUI />
          </div>
          <div className="bg-blue-600 w-full text-black relative h-8 px-2 flex items-center gap-4 uppercase text-white font-mono font-medium">
            <div className="fixed top-0 left-1/2 -translate-x-1/2 h-0">
              <PockitLogo />
            </div>
            <Link href="/" className="hover:text-yellow-300 hover:font-black cursor-pointer">Home</Link>
            <Link href="/about" className="hover:text-yellow-300 hover:font-black cursor-pointer">About</Link>
            {/* <Link href="/games" className="hover:text-yellow-300 hover:font-black cursor-pointer">Games</Link> */}
          </div>
        </div>

        {children}
      </body>
    </html>
  );
}