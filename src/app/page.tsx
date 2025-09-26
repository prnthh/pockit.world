"use client";

import Link from "next/link";
import DropDownPage from "./ui/DropDownPage";
import RoomSpecificGame from "./RoomGame";
import PockitLogo from "./ui/PockitLogo";
import { useAudio } from "@/shared/AudioProvider";

export default function Home() {
  return (
    <DropDownPage>
      <PockitLogo />
      <div className="flex flex-col items-center gap-4 mb-6 mx-auto">
        <Link href="/about" className="group">
          <NavButton color="from-yellow-300/50 via-yellow-400/50 to-yellow-500/50 group-hover:shadow-yellow-900/50 border-yellow-600">
            <span className="relative z-10 drop-shadow-md">About Us</span>
            <span className="relative z-10 text-xs block mt-1 opacity-80 drop-shadow">Independent Game Studio</span>
          </NavButton>
        </Link>
        <Link href="/milady" className="group">
          <NavButton color="from-green-200/50 via-green-300/50 to-green-400/50 group-hover:shadow-green-900/50 border-green-800">
            <span className="relative z-10 drop-shadow-md">Pockit Milady</span>
            <span className="relative z-10 text-xs block mt-1 opacity-80 drop-shadow">Interactive 3D models inspired by Milady Maker</span>
          </NavButton>
        </Link>
        <Link href="https://draw.pockit.world" target="_blank" className="group">
          <NavButton color="from-blue-300/50 via-blue-400/50 to-blue-500/50 group-hover:shadow-blue-900/50 border-blue-600">
            <span className="relative z-10 drop-shadow-md">Draw It</span>
            <span className="relative z-10 text-xs block mt-1 opacity-80 drop-shadow">PvP Drawing with an AI judge on Sanko Chain</span>
          </NavButton>
        </Link>
      </div>
      <RoomSpecificGame />
    </DropDownPage>
  );
}

const NavButton = ({ children, color = "from-blue-300/50 via-blue-400/50 to-blue-500/50 group-hover:shadow-blue-900/50 border-blue-600" }: { children: React.ReactNode; color?: string }) => {
  const { playSound } = useAudio();


  return (
    <div
      className={`retro-btn bg-gradient-to-br ${color} text-black font-semibold rounded-2xl shadow-lg px-6 py-4 transition-all duration-300 transform group-hover:scale-105 group-hover:rotate-1 relative overflow-hidden backdrop-blur-md border-2`}
      style={{ width: "300px" }}
      onPointerEnter={() => playSound()}
    >
      <div className="absolute inset-0 bg-white opacity-20 rounded-2xl pointer-events-none group-hover:animate-pulse" />
      <div className="absolute top-0 left-0 w-full h-1 bg-white/60 rounded-t-2xl blur-sm" />
      <span className="relative z-10 drop-shadow-md">{children}</span>
    </div>
  );
};
