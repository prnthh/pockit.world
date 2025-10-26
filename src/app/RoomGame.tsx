"use client";

import DialogCollider, { RevealTextByWord } from "@/shared/ped/DialogCollider";
import Ped from "@/shared/ped/ped";
import { useContext, useEffect, useState } from "react";
import { ScenePortalContext } from "./ScenePortalProvider";
import NetworkThing from "./NetworkThing";
import * as THREE from "three";
import { useAudio } from "@/shared/AudioProvider";
import { Stats } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import PortalDoor from "@/shared/physics/Door";
import { useRouter } from "next/navigation";

const RoomSpecificGame = () => {
    const { scenePortal } = useContext(ScenePortalContext);
    const { playSound } = useAudio();
    const router = useRouter();

    return <>
        <scenePortal.In>
            <World />
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
                label="Game 1"
                position={[2, 0, -7.2]}
                rotation={[0, 0, 0]}
                onConfirm={() => {
                    router.push(`/game1`);
                }}
            // scale={[1, 1, 1]}
            // doorModelUrl="/models/environment/PortalDoor.glb"
            // targetScene="lobby"
            >
                Connect your wallet to view your Gallery

            </PortalDoor>
        </scenePortal.In>
    </>;

}

const World = () => {
    return <>
        <TalkativeNPC name="PockitCEO" position={[1, 0, -4]} />
        <TalkativeNPC name="PockitEmployee" position={[-1, 0, -4]} />
    </>;
}

const TalkativeNPC = ({ name, position }: { name: string, position: [number, number, number] }) => {
    const [playerRef, setPlayerRef] = useState<THREE.Object3D | null>(null);
    const { scene } = useThree();
    const { playSound } = useAudio();

    useEffect(() => {
        const player = scene.getObjectByName('player');
        if (player) {
            setPlayerRef(player as THREE.Object3D);
        } else {
            console.warn('Player object not found in scene');
        }
    }, [scene]);

    if (!scene) return null;

    return <><Ped
        key={name}
        basePath={"/models/human/onimilio/"}
        modelUrl={"rigged.glb"}
        position={position} height={1.5}
        lookTarget={{ current: playerRef }}
    >
        <DialogCollider>
            <DialogBox playSound={playSound} title={name} text={"The office is under construction. Please check back later!"} />
        </DialogCollider>
    </Ped></>;
}

const DialogBox = ({ text, title, playSound }: { text: string, title?: string, playSound: (url: string) => void }) => {
    return <div className="select-none relative rounded rounded-3xl bg-[#b9de77aa] p-4 text-xl text-black scale-300 max-w-[400px] shadow-[inset_8px_8px_6px_-6px_#ffffffaa,inset_-8px_-8px_6px_-6px_#00000066,0_4px_12px_-6px_#00000066]">
        <div className="font-mono">
            <RevealTextByWord text={text} speed={200} playSound={playSound} />
        </div>
        {title && <div className="absolute -top-5 left-4 bg-[#b9de77] rounded px-2 border text-lg italic">
            {title}
        </div>}
    </div>
}

export default RoomSpecificGame;