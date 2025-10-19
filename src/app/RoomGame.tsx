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

const RoomSpecificGame = () => {
    const { scenePortal } = useContext(ScenePortalContext);
    const { playSound } = useAudio();

    return <>
        <scenePortal.In>
            <NPCScene />
            <NetworkThing
                scale={new THREE.Vector3(0.03, 0.03, 0.03)}
                position={new THREE.Vector3(1.6, 0.64, 0.4)}
                modelUrl="/models/environment/Bell.glb"
                id="bell"
                onActivate={() => {
                    console.log('Bell activated');
                    playSound("/sound/click.mp3"); // Play remotely if soundUrl provided

                }}
            />
            <Stats />
        </scenePortal.In>
    </>;

}

const NPCScene = () => {
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
        key={'np21'}
        basePath={"/models/human/onimilio/"}
        modelUrl={"rigged.glb"}
        position={[1, 0, -4]} height={1.5}
        lookTarget={{ current: playerRef }}
    >
        <DialogCollider>
            {(
                <div className="rounded rounded-xl bg-[#b9de77] p-4 text-xl text-black scale-300 max-w-[400px]">
                    <div className="">
                        <RevealTextByWord text="The office is under construction! Please come back later." speed={200} playSound={playSound} />
                    </div>
                </div>
            )}
        </DialogCollider>
    </Ped></>;
}

export default RoomSpecificGame;