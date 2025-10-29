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
    const { addEntity } = useGameStore();

    const npcEntities = allEntityIDsByType('NPC');
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current || npcEntities.length > 0) return;
        console.log('Adding NPC entities');
        addEntity({ name: 'PockitCEO', type: 'NPC', position: [1, 0, -4], basePath: "/models/human/boss/", modelUrl: "model.glb" });
        addEntity({ name: 'Employee', type: 'NPC', position: [-1, 0, -4] });
        initialized.current = true;
    }, [addEntity, npcEntities.length]);

    return <>
        {npcEntities.map((id) => <TalkativeNPC key={id} id={id} />)}
    </>;
}

const TalkativeNPC = ({ id }: { id: string }) => {
    const entity = useEntityById(id);
    if (!entity) return null;

    const { name, position } = entity;

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
        basePath={entity.basePath || "/models/human/onimilio/"}
        modelUrl={entity.modelUrl || "rigged.glb"}
        position={position} height={1.5}
        lookTarget={{ current: playerRef }}
    >
        <DialogCollider>
            <DialogBox playSound={playSound} title={name} text={"The office is under construction. Please check back later!"} />
        </DialogCollider>
    </Ped></>;
}



export default RoomSpecificGame;