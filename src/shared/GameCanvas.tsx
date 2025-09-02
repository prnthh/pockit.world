import { Canvas, extend } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { Suspense, useState } from "react";

// generic version
// extend(THREE as any)

extend({
    MeshBasicNodeMaterial: THREE.MeshBasicNodeMaterial,
    MeshStandardNodeMaterial: THREE.MeshStandardNodeMaterial,
});


export default function GameCanvas({ children, ...props }: { children: React.ReactNode, props?: any }) {
    const [frameloop, setFrameloop] = useState<"never" | "always">("never");
    const [loading, setLoading] = useState(true);

    return <>
        {loading && <Loading />}

        <Canvas
            shadows={{ type: THREE.PCFSoftShadowMap }}
            frameloop={frameloop}
            gl={async ({ canvas }) => {
                const renderer = new THREE.WebGPURenderer({
                    // ...props as any,
                    canvas: canvas as HTMLCanvasElement,
                    antialias: true,
                    stencil: false,
                    // powerPreference: "high-performance",
                    // alpha: false, // makes background opaque
                    // @ts-expect-error futuristic
                    shadowMap: true,
                });
                await renderer.init().then(() => {
                    setFrameloop("always");
                });
                return renderer
            }}
            camera={{
                position: [0, 2, 5],
                fov: 50, near: 0.25,
                far: 50
            }}
        >
            <Suspense>
                {children}
                <DelayedLoadingScreen onLoad={() => setLoading(false)} />
            </Suspense>
        </Canvas>
    </>;
}


const Loading = () => {
    return (
        <div className="absolute flex items-center justify-center w-screen h-screen z-5 backdrop-blur-md text-white font-black">
            Loading...
        </div>
    );
}

const DelayedLoadingScreen = ({ onLoad }: { onLoad: () => void }) => {
    setTimeout(() => {
        onLoad();
    }, 100);
    return null;
};