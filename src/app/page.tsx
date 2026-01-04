import { Metadata } from "next";
import Link from "next/link";
import { NavButton } from "./NavButton";

export const metadata: Metadata = {
  title: "Pockit Game Corp",
  description: "Homepage of Pockit Game Corp, an independent game studio founded by veterans from Zynga and Rockstar Games.",
  openGraph: {
    type: 'website',
    title: 'Pockit Game Corp',
    description: 'Homepage of Pockit Game Corp, an independent game studio founded by veterans from Zynga and Rockstar Games.',
    url: 'https://pockit.world',
    images: 'https://pockit.world/ui/pockitlogo.png',
  },
  twitter: {
    card: 'summary',
    title: 'Pockit Game Corp',
    description: 'Homepage of Pockit Game Corp, an independent game studio founded by veterans from Zynga and Rockstar Games.',
    creator: '@pockitmilady',
    images: ["https://pockit.world/ui/pockitlogo.png"],
  }
};

export default function Home() {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mx-auto max-w-2xl justify-items-center" style={{ perspective: '1000px' }}>
    <Link href="/about" className="group inline-block">
      <NavButton color="from-yellow-200/80 to-white group-hover:shadow-yellow-900/70">
        <span className="relative z-10">About Us</span>
        <span className="relative z-10 text-sm block mt-1 opacity-80">Independent Game Studio</span>
      </NavButton>
    </Link>
    <Link href="/milady" className="group inline-block">
      <NavButton color="from-green-200/80 to-white group-hover:shadow-green-900/70">
        <span className="relative z-10">Pockit Milady</span>
        <span className="relative z-10 text-sm block mt-1 opacity-80">Interactive 3D models <br />inspired by Milady Maker</span>
      </NavButton>
    </Link>
    <Link href="https://draw.pockit.world" target="_blank" className="group inline-block">
      <NavButton color="from-blue-200/80 to-white group-hover:shadow-blue-900/70">
        <span className="relative z-10">Draw It</span>
        <span className="relative z-10 text-sm block mt-1 opacity-80">PvP Drawing with an AI judge <br />on Sanko Chain</span>
      </NavButton>
    </Link>
    <Link href="https://prnth.com/react-three-game" target="_blank" className="group inline-block">
      <NavButton color="from-red-200/80 to-white group-hover:shadow-red-900/70">
        <span className="relative z-10">react-three-game</span>
        <span className="relative z-10 text-sm block mt-1 opacity-80">3D prefab editor for React</span>
      </NavButton>
    </Link>
  </div>;
}
