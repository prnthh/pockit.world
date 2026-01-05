import { Metadata } from "next";
import Link from "next/link";
import { NavButton3D } from "./NavButton3D";

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

export default function Home() {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mx-auto max-w-2xl justify-items-center" style={{ perspective: '1000px' }}>
    <Link href="/about" className="group inline-block">
      <NavButton3D className="retro-btn bg-gradient-to-b from-yellow-200/80 to-white group-hover:shadow-yellow-900/70 text-black font-sans font-semibold rounded-3xl shadow-[0_4px_4px_rgba(0,0,0,0.1)] px-4 py-4 transition-all ease-out relative overflow-hidden backdrop-blur-xl border-2 border-gray-500/50 hover:scale-[1.03] active:scale-95" style={{ width: "320px", height: "180px" }}>
        <div className="relative flex flex-col justify-between h-full z-10 text-xl">
          <span className="relative z-10">About Us</span>
          <span className="relative z-10 text-sm block mt-1 opacity-80">Independent Game Studio</span>
        </div>
      </NavButton3D>
    </Link>
    <Link href="/milady" className="group inline-block">
      <NavButton3D className="retro-btn bg-gradient-to-b from-green-200/80 to-white group-hover:shadow-green-900/70 text-black font-sans font-semibold rounded-3xl shadow-[0_4px_4px_rgba(0,0,0,0.1)] px-4 py-4 transition-all ease-out relative overflow-hidden backdrop-blur-xl border-2 border-gray-500/50 hover:scale-[1.03] active:scale-95" style={{ width: "320px", height: "180px" }}>
        <div className="relative flex flex-col justify-between h-full z-10 text-xl">
          <span className="relative z-10">Pockit Milady</span>
          <span className="relative z-10 text-sm block mt-1 opacity-80">Interactive 3D models <br />inspired by Milady Maker</span>
        </div>
      </NavButton3D>
    </Link>
    <Link href="https://draw.pockit.world" target="_blank" className="group inline-block">
      <NavButton3D className="retro-btn bg-gradient-to-b from-blue-200/80 to-white group-hover:shadow-blue-900/70 text-black font-sans font-semibold rounded-3xl shadow-[0_4px_4px_rgba(0,0,0,0.1)] px-4 py-4 transition-all ease-out relative overflow-hidden backdrop-blur-xl border-2 border-gray-500/50 hover:scale-[1.03] active:scale-95" style={{ width: "320px", height: "180px" }}>
        <div className="relative flex flex-col justify-between h-full z-10 text-xl">
          <span className="relative z-10">Draw It</span>
          <span className="relative z-10 text-sm block mt-1 opacity-80">PvP Drawing with an AI judge <br />on Sanko Chain</span>
        </div>
      </NavButton3D>
    </Link>
    <Link href="https://prnth.com/react-three-game" target="_blank" className="group inline-block">
      <NavButton3D className="retro-btn bg-gradient-to-b from-red-200/80 to-white group-hover:shadow-red-900/70 text-black font-sans font-semibold rounded-3xl shadow-[0_4px_4px_rgba(0,0,0,0.1)] px-4 py-4 transition-all ease-out relative overflow-hidden backdrop-blur-xl border-2 border-gray-500/50 hover:scale-[1.03] active:scale-95" style={{ width: "320px", height: "180px" }}>
        <div className="relative flex flex-col justify-between h-full z-10 text-xl">
          <span className="relative z-10">react-three-game</span>
          <span className="relative z-10 text-sm block mt-1 opacity-80">3D prefab editor for React</span>
        </div>
      </NavButton3D>
    </Link>
  </div>;
}
