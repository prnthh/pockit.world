"use client";

import Link from "next/link";
import { useRef } from "react";

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

const NavButton = ({ children, color = "from-blue-300/50 via-blue-400/50 to-blue-500/50 group-hover:shadow-blue-900/50 border-blue-600" }: { children: React.ReactNode; color?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !shineRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const rotateY = (mouseX / (rect.width / 2)) * 25;
    const rotateX = -(mouseY / (rect.height / 2)) * 25;

    // Direct DOM manipulation for smooth performance
    cardRef.current.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

    // Update shine position based on mouse position
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    shineRef.current.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 30%, transparent 60%)`;
    shineRef.current.style.opacity = '1';
  };

  const handleMouseLeave = () => {
    if (!cardRef.current || !shineRef.current) return;
    cardRef.current.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
    shineRef.current.style.opacity = '0';
  };

  return (
    <div
      ref={cardRef}
      className={`retro-btn bg-gradient-to-b ${color} text-black font-sans font-semibold rounded-3xl shadow-[0_4px_4px_rgba(0,0,0,0.1)] px-4 py-4 transition-all ease-out relative overflow-hidden backdrop-blur-xl border-2 border-gray-500/50 hover:scale-[1.03] active:scale-95`}
      style={{
        width: "320px",
        height: "180px",
        transformStyle: 'preserve-3d',
        transform: 'perspective(1200px) rotateX(0deg) rotateY(0deg)',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Shine effect overlay */}
      <div
        ref={shineRef}
        className="absolute inset-0 pointer-events-none rounded-xl transition-opacity duration-300"
        style={{ opacity: 0 }}
      />
      <div className="relative flex flex-col justify-between h-full z-10 text-xl">{children}</div>
    </div>
  );
};
