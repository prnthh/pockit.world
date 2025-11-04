"use client";

import DialogCollider, { DialogBox, RevealTextByWord } from "@/shared/ped/DialogCollider";
import Ped from "@/shared/ped/ped";
import { ScenePortalContext } from "../ScenePortalProvider";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAudio } from "@/shared/AudioProvider";
import InteractiveSphere from "@/shared/shaders/InteractiveSphere";
import CrawlerApp from "@/shared/ik/CrawlerPed";
import Terrain from "@/shared/physics/Terrain";
import useGameStore, { allEntityIDsByType, useEntityById } from "../stores/GameStore";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useEditorContext } from "../editor/scene/editor/EditorContext";

const RoomSpecificGame = () => {
    const { scenePortal } = useContext(ScenePortalContext);
    const { playSound } = useAudio();

    return <>
        <scenePortal.In>
            <InteractiveSphere position={[-2, 1, 4]} />
            <Terrain />

            <CrawlerApp spawn={[0, 4, 10]} />

            <World />
        </scenePortal.In>
    </>;

}


const World = () => {
    const { sceneGraph, addNodeToRoot } = useEditorContext();
    const { addEntity } = useGameStore();
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        addNodeToRoot({
            id: 'box1',
            name: 'Box 1',
            transform: {
                position: [0, 2, 2],
                rotation: [0, 0, 0],
                scale: 1,
            },
            components: [
                {
                    type: 'boxGeometry', meshType: 'box', args: [1, 1, 1],
                },
                {
                    type: 'meshStandardMaterial', materialType: 'meshStandardMaterial', args: [{ color: 'blue' }],
                },
                {
                    type: 'physics', props: { type: 'dynamic' },
                }
            ],
            children: [],
        });

        console.log('Adding NPC entities');
        addEntity({ name: 'PockitCEO', type: 'NPC', position: [1, 0, -4], basePath: "/models/human/boss/", modelUrl: "model.glb", goal: 'follow' });
        addEntity({ name: 'Employee', type: 'NPC', position: [-1, 0, -4], goal: 'hunt' });
        addEntity({ type: 'pickupable', position: [2, 0, 2] });
        addEntity({ type: 'pickupable', position: [5, 0, 2] });
        addEntity({ type: 'pickupable', position: [8, 0, 2] });
        initialized.current = true;
    }, [addEntity]);

    return <>
        {allEntityIDsByType('NPC').map((id) => <TalkativeNPC key={id} id={id} />)}
        {allEntityIDsByType('pickupable').map((id) => <Pickupable key={id} id={id} />)}
    </>;
}

const TalkativeNPC = ({ id }: { id: string }) => {
    const { updateEntity } = useGameStore();
    const entity = useEntityById(id);
    if (!entity) return null;

    const { name, position } = entity;

    const [playerRef, setPlayerRef] = useState<THREE.Object3D | null>(null);
    const { scene } = useThree();
    const { playSound } = useAudio();

    const [isTalking, setIsTalking] = useState(false);

    const walkToPlayer = useMemo(() => {
        return () => {
            const playerPosition = playerRef?.position;
            if (!playerPosition) return;
            walkTo([playerPosition.x + Math.random() * 2 - 1, 0, playerPosition.z + Math.random() * 2 - 1])
        };
    }, [playerRef]);

    const walkTo = (position: [number, number, number]) => {
        updateEntity(id, { position: position });
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (entity.goal === 'follow')
                walkToPlayer();
        }, 5000);
        return () => clearInterval(interval);
    }, [walkToPlayer, entity.goal]);


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
        <DialogCollider onExit={() => { setIsTalking(false) }}>
            {!isTalking && <ActivationToggle onActivate={() => {
                setIsTalking(true);
            }} />}
            {isTalking && <DialogBox playSound={playSound} title={name} text={"The office is under construction. Please check back later!"} />}
        </DialogCollider>
    </Ped></>;
}

const ActivationToggle = ({ onActivate }: { onActivate: () => void }) => {
    return <div className="flex max-w-[200px] justify-center">
        <div className="bg-black/80 rounded-md scale-200 p-2 cursor-pointer" onClick={onActivate}>talk?</div>
    </div>;
}

const Pickupable = ({ id }: { id: string }) => {
    const entity = useEntityById(id);
    const { removeEntity } = useGameStore();
    const { playSound } = useAudio();

    if (!entity) return null;
    return <mesh position={entity.position}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="orange" />
        <DialogCollider radius={0.2} onEnter={() => {
            console.log('Picked up item:', id);
            setTimeout(() => {
                removeEntity(id);
                playSound("/sound/pop.mp3");
            }, 0);
        }} />
    </mesh>;
}


export default RoomSpecificGame;