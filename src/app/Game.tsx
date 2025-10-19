"use client";

import { Physics, RapierRigidBody } from "@react-three/rapier";
import { Environment, Html } from "@react-three/drei";
import Controls, { useControlScheme } from "@/shared/controls/ControlsProvider";
import { ShadowLight } from "@/shared/lighting/ShadowLight";
import { Suspense, useEffect, useRef, useState } from "react";
import GameCanvas from "@/shared/GameCanvas";
import { EditorModes, SceneNode, Viewer } from "@/app/editor/scene/viewer/SceneViewer";
import { GameEngine } from "@/app/editor/scene/editor/EditorContext";
import { CharacterController } from "@/shared/shouldercam/CharacterController";
import dynamic from 'next/dynamic'
import { Group, Mesh } from "three";
import { useContext } from 'react'
import { usePathname } from 'next/navigation';
import tunnel from "tunnel-rat";
import ModelAttachment from "@/shared/ped/ModelAttachment";
import * as THREE from "three";
import Ped from "@/shared/ped/ped";

import office from "./map";
import officeOutdoors from "./about/map";
import killbox from "./milady/map";
import test from "./test/map";
import { ScenePortalContext } from "./ScenePortalProvider";
import PostProcessingEffects from "@/shared/shaders/PostProcessingEffects";
import RenderPipeline from "@/shared/shaders/PostProcessingEffects";

const ui = tunnel()

const GameWrappers = () => {
    const pathname = usePathname();
    const [scene, setScene] = useState<SceneNode[]>(office as unknown as SceneNode[]);


    useEffect(() => {
        // Load the scene based on the pathname
        console.log('Loading scene for pathname:', pathname);
        if (pathname === '/about') {
            setScene(officeOutdoors as unknown as SceneNode[]);
        } else if (pathname === '/milady') {
            setScene(killbox as unknown as SceneNode[]);
        } else if (pathname === '/test') {
            setScene(test as unknown as SceneNode[]);
        } else {
            // Handle other paths or set a default scene
            setScene(office as unknown as SceneNode[]);
        }
    }, [pathname]);

    return (
        <div className="items-center justify-items-center min-h-screen">
            <div className="w-full" style={{ height: "100vh" }}>
                <Controls>
                    <GameEngine mode={EditorModes.Play} sceneGraph={scene}>
                        <GameCanvas>
                            <Physics paused={false}>
                                {/* remove the pathname key to persist the world between pages */}
                                <Game key={pathname} />
                            </Physics>
                            {/* <RenderPipeline /> */}
                        </GameCanvas>
                    </GameEngine>
                </Controls>
            </div>
            <ui.Out />
        </div>
    );
}

const Game = () => {
    const rbref = useRef<RapierRigidBody | null>(null);
    const meshref = useRef<Group | null>(null);
    const pathname = usePathname();
    const { scenePortal } = useContext(ScenePortalContext);
    const { scheme } = useControlScheme();

    // Broadcast character position every second
    useEffect(() => {
        const interval = setInterval(() => {
            if (rbref.current) {
                const pos = rbref.current.translation();
                window.dispatchEvent(new CustomEvent('mp-pos', { detail: [pos.x, pos.y, pos.z] }))
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return <>
        <Viewer />
        <CharacterController
            mode={scheme == "advanced" ? "third-person" : "simple"}
            forwardRef={({ rbref: rb, meshref: mesh }) => {
                rbref.current = rb.current;
                meshref.current = mesh.current;
            }}
        >
            {/* {<ModelAttachment
                model="/models/environment/Katana.glb"
                attachpoint="mixamorigRightHand"
                offset={new THREE.Vector3(2, 7, 8)}
                scale={new THREE.Vector3(100, 100, 100)}
                rotation={new THREE.Vector3(-Math.PI / 6, Math.PI / 3, -Math.PI / 3)}
            />} */}
        </CharacterController>

        <scenePortal.Out />

        {/* <MPStuff /> */}

        <ambientLight intensity={0.5} />
        <ShadowLight intensity={3} />

        <SceneEventHandler />
        <Environment preset="sunset" background={false} />

        <color attach="background" args={["#000000"]} />
        {/* <PostProcessingEffects /> */}
    </>
}

const SceneEventHandler = () => {
    useEffect(() => {
        const handler = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { name } = customEvent.detail;
            console.log(`Scene event triggered: ${name}`);

            // if (name === 'easel.glb') {
            //   // navigate to draw.pockit.world in a new tab
            //   window.open('https://draw.pockit.world', '_blank');
            // }
            // Handle scene events here
        };
        window.addEventListener('scene-pointer-event', handler);
        return () => {
            window.removeEventListener('scene-pointer-event', handler);
        };
    }, []);
    // Handle scene events here
    return null;
};

// function PeerPed({ peerId, state }: { peerId: string, state: PeerState }) {
//     // Show latest chat message if less than 5 seconds old
//     const now = Date.now();
//     const showMsg = state.latestMessage && (now - state.latestMessage.timestamp < 5000);

//     return (
//         <Ped
//             key={peerId}
//             basePath={"/models/human/onimilio/"}
//             modelUrl={"rigged.glb"}
//             position={state.position} height={1.5}
//         >
//             {state.profile?.avatar && <ModelAttachment
//                 model="/models/environment/Katana.glb"
//                 attachpoint="mixamorigRightHand"
//                 offset={new THREE.Vector3(0, 0, 0)}
//                 scale={new THREE.Vector3(100, 100, 100)}
//                 rotation={new THREE.Vector3(0, 0, 0)}
//             />}
//             {showMsg && (
//                 <Html position={[0, 1.4, 0]} zIndexRange={[5, 10]}>
//                     <div className="-translate-x-[50%] min-w-[300px] text-3xl text-yellow-300 text-center p-2 rounded drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
//                         {state.latestMessage?.message}
//                     </div>
//                 </Html>
//             )}
//         </Ped>
//     );
// }

// const MPStuff = () => {
//     const { peerStates } = useContext(MPContext)
//     return <>
//         {/* Peer peds */}
//         {Object.entries(peerStates).map(([peerId, state]) => (
//             <PeerPed key={peerId} peerId={peerId} state={state} />
//         ))}
//     </>
// }

export default GameWrappers;