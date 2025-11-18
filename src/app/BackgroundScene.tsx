"use client";
import GameCanvas from "@/shared/GameCanvas";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { Group } from "three";

export default function BackgroundScene() {
    return (
        <div className="absolute w-screen h-screen">
            <GameCanvas>
                <ambientLight intensity={1} />
                <directionalLight position={[0, 10, 5]} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />
                <Suspense fallback={null}>
                    <PockitLogo />
                </Suspense>
            </GameCanvas>
        </div>
    );
};

const PockitLogo = () => {
    const { scene } = useGLTF('/pockitlogo.glb');
    const ref = useRef<Group>(null);

    useFrame(() => {
        if (ref.current) {
            ref.current.rotation.z += 0.01;
        }
    });

    return <primitive ref={ref} object={scene} scale={0.5} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]} />;
}