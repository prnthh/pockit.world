import { Metadata } from "next";
import Link from "next/link";
import { NavButton3D } from "../components/NavButton3D";
import HeroCharacter from "@/components/HeroCharacter";

export const metadata: Metadata = {
  title: "Pockit Game Corp",
  description: "Independent game studio building perpetual games using blockchain technology.",
  openGraph: {
    type: 'website',
    title: 'Pockit Game Corp',
    description: 'Independent game studio building perpetual games using blockchain technology.',
    url: 'https://pockit.world',
    images: 'https://pockit.world/ui/logos/pockitlogo.png',
  },
  twitter: {
    card: 'player',
    title: 'Pockit Game Corp',
    description: 'Independent game studio on Ethereum.',
    creator: '@pockitmilady',
    images: ["https://pockit.world/ui/logos/pockitlogo.png"],
  }
};

export default function Home() {
  return <>
    <HeroCharacter />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 mx-auto max-w-2xl justify-items-center" style={{ perspective: '1000px' }}>
      <Link href="/about" className="group inline-block">
        <NavButton3D className="bg-gradient-to-b from-blue-200/80 to-white group-hover:shadow-blue-900/70" style={{ width: "320px", height: "180px" }}>
          <div className="relative flex flex-col justify-between h-full z-10 text-xl">
            <span className="relative z-10">About Us</span>
            <span className="relative z-10 text-sm block mt-1 opacity-80">Independent Game Studio</span>
          </div>
        </NavButton3D>
      </Link>
      <Link href="https://prnth.com/react-three-game" target="_blank" className="group inline-block">
        <NavButton3D className="bg-gradient-to-b from-slate-300/80 to-slate-100 group-hover:shadow-slate-900/70" style={{ width: "320px", height: "180px" }}>
          <div className="relative flex flex-col justify-between h-full z-10 text-xl">
            <span className="relative z-10">react-three-game</span>
            <span className="relative z-10 text-sm block mt-1 opacity-80">3D prefab editor for React</span>
          </div>
        </NavButton3D>
      </Link>
      <Link href="/milady" className="group inline-block">
        <NavButton3D className="bg-gradient-to-b from-green-200/80 to-white group-hover:shadow-green-900/70" style={{ width: "320px", height: "180px" }}>
          <div className="relative flex flex-col justify-between h-full z-10 text-xl">
            <span className="relative z-10">Pockit Milady</span>
            <span className="relative z-10 text-sm block mt-1 opacity-80">Interactive 3D models <br />inspired by Milady Maker</span>
          </div>
        </NavButton3D>
      </Link>
      <a href="/remilio/index.html" className="group inline-block">
        <NavButton3D className="bg-gradient-to-b from-red-200/80 to-white group-hover:shadow-red-900/70" style={{ width: "320px", height: "180px" }}>
          <div className="relative flex flex-col justify-between h-full z-10 text-xl">
            <span className="relative z-10">Pockit Remilio</span>
            <span className="relative z-10 text-sm block mt-1 opacity-80">Remilio Maker<br />Generate a 3D Remilio</span>
          </div>
        </NavButton3D>
      </a>
    </div>
  </>;
}
