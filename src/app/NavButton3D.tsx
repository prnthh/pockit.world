"use client";

import { useRef } from "react";

export const NavButton3D = ({ children }: { children: React.ReactNode }) => {
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
            className="absolute inset-0"
            style={{
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
            {children}
        </div>
    );
};
