"use client";

import DialogCollider, { DialogBox, RevealTextByWord } from "@/shared/ped/DialogCollider";
import Ped from "@/shared/ped/ped";
import { useContext, useEffect, useState, useRef } from "react";
import { ScenePortalContext } from "./ScenePortalProvider";
import NetworkThing from "./NetworkThing";
import * as THREE from "three";
import { useAudio } from "@/shared/AudioProvider";
import { Stats } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import PortalDoor from "@/shared/physics/Door";
import { useRouter } from "next/navigation";
import useGameStore, { allEntityIDsByType, useEntityById } from "./stores/GameStore";

const RoomSpecificGame = () => {
    const { scenePortal } = useContext(ScenePortalContext);
    const { playSound } = useAudio();
    const router = useRouter();

    return <>
        <scenePortal.In>
            <NetworkThing
                scale={new THREE.Vector3(0.03, 0.03, 0.03)}
                position={new THREE.Vector3(1.6, 0.64, 3)}
                modelUrl="/models/environment/Bell.glb"
                id="bell"
                onActivate={() => {
                    console.log('Bell activated');
                    playSound("/sound/click.mp3"); // Play remotely if soundUrl provided

                }}
            />
            <Stats />

            <PortalDoor
                label="Exit"
                position={[0, 0, -7.2]}
                rotation={[0, 0, 0]}
                onConfirm={() => {
                    router.push(`/about`);
                }}
            // scale={[1, 1, 1]}
            // doorModelUrl="/models/environment/PortalDoor.glb"
            // targetScene="lobby"
            >
                Head outside

            </PortalDoor>

            <PortalDoor
                label="Nickelodeon"
                position={[2, 0, -7.2]}
                rotation={[0, 0, 0]}
                onConfirm={() => {
                    router.push(`/game1`);
                }}
            >
                Connect your wallet to view your Gallery
            </PortalDoor>
        </scenePortal.In>
    </>;

}



export default RoomSpecificGame;