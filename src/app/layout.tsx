import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
import tunnel from "tunnel-rat";
import { ScenePortalWrapper } from "./ScenePortalProvider";
import { AudioProvider } from "./AudioProvider";
const Game = dynamic(() => import("./Game"), { ssr: true });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const scenePortal = tunnel();

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
        <AudioProvider>
          <ScenePortalWrapper>
            {children}
            <Game />
          </ScenePortalWrapper>
        </AudioProvider>
      </body>
    </html>
  );
}