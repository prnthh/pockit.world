"use client";
import GameCanvas from "@/shared/GameCanvas";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group } from "three";

export default function BackgroundScene() {
    return (
        <div className="absolute w-screen h-screen">
            <GameCanvas>
                <ambientLight intensity={0.5} />
                <pointLight position={[0, -2, 2]} intensity={50} />
                <PockitLogo />
            </GameCanvas>
        </div>
    );
};

const PockitLogo = () => {
    const { scene } = useGLTF('/pockitlogo.glb');
    const ref = useRef<Group>(null);

    useFrame(() => {
        if (ref.current) {
            const next = ref.current.rotation.z + 0.01;
            ref.current.rotation.z = next >= Math.PI / 2 && next < (3 * Math.PI) / 2 ? (3 * Math.PI) / 2 : next >= 2 * Math.PI ? 0 : next;
        }
    });

    return <primitive ref={ref} object={scene} scale={0.5} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]} />;
}