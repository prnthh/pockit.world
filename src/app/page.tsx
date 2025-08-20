
import Link from "next/link";
import DropDownPage from "./ui/DropDownPage";
import RoomSpecificGame from "./RoomGame";

export default function Home() {
  return (
    <DropDownPage>

      <h1 className="text-2xl font-bold mt-6 mb-4">
        Pockit Game Corp
      </h1>
      <div className="flex flex-col items-center gap-4 mb-6 mx-auto">
        <Link href="/about" className="group">
          <div className="retro-btn bg-gradient-to-br from-green-700 via-green-800 to-green-950 text-white font-semibold rounded-2xl shadow-lg px-6 py-4 transition-all duration-300 transform group-hover:scale-105 group-hover:rotate-1 group-hover:shadow-green-900/50 relative overflow-hidden border-2 border-green-800 backdrop-blur-md" style={{ width: '300px' }}>
            <div className="absolute inset-0 bg-white opacity-20 rounded-2xl pointer-events-none group-hover:animate-pulse" />
            <div className="absolute top-0 left-0 w-full h-1 bg-white/60 rounded-t-2xl blur-sm" />
            <span className="relative z-10 drop-shadow-md">About Us</span>
            <span className="relative z-10 text-xs block mt-1 opacity-80 drop-shadow">Independent Game Studio</span>
          </div>
        </Link>
        <Link href="/milady" className="group">
          <div className="retro-btn bg-gradient-to-br from-purple-700 via-purple-800 to-purple-950 text-white font-semibold rounded-2xl shadow-lg px-6 py-4 transition-all duration-300 transform group-hover:scale-105 group-hover:-rotate-1 group-hover:shadow-purple-900/50 relative overflow-hidden border-2 border-purple-800 backdrop-blur-md" style={{ width: '300px' }}>
            <div className="absolute inset-0 bg-white opacity-20 rounded-2xl pointer-events-none group-hover:animate-pulse" />
            <div className="absolute top-0 left-0 w-full h-1 bg-white/60 rounded-t-2xl blur-sm" />
            <span className="relative z-10 drop-shadow-md">Pockit Milady</span>
            <span className="relative z-10 text-xs block mt-1 opacity-80 drop-shadow">Interactive 3D models inspired by Milady Maker</span>
          </div>
        </Link>
        <Link href="https://draw.pockit.world" target="_blank" className="group">
          <div className="retro-btn bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 text-white font-semibold rounded-2xl shadow-lg px-6 py-4 transition-all duration-300 transform group-hover:scale-105 group-hover:rotate-2 group-hover:shadow-blue-900/50 relative overflow-hidden border-2 border-blue-800 backdrop-blur-md" style={{ width: '300px' }}>
            <div className="absolute inset-0 bg-white opacity-20 rounded-2xl pointer-events-none group-hover:animate-pulse" />
            <div className="absolute top-0 left-0 w-full h-1 bg-white/60 rounded-t-2xl blur-sm" />
            <span className="relative z-10 drop-shadow-md">Draw It</span>
            <span className="relative z-10 text-xs block mt-1 opacity-80 drop-shadow">PvP Drawing with an AI judge on Sanko Chain</span>
          </div>
        </Link>
      </div>
      <RoomSpecificGame />
    </DropDownPage>
  );
}

