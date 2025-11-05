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
import { SceneNode } from "../editor/scene/viewer/SceneViewer";
import { Html } from "@react-three/drei";

const RoomSpecificGame = () => {
    const { scenePortal } = useContext(ScenePortalContext);
    const { playSound } = useAudio();

    return <>
        <scenePortal.In>
            <InteractiveSphere position={[-2, 1, 4]} />
            {/* <Terrain /> */}

            <CrawlerApp spawn={[0, 4, 10]} />

            <World />
        </scenePortal.In>
    </>;

}

const World = () => {
    const { sceneGraph, insertSceneWithOffset } = useEditorContext();
    const { addEntity } = useGameStore();
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        insertSceneWithOffset([cube], { x: 20, y: 0, z: 0 });

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

    const [moveTargetRef, setMoveTargetRef] = useState<THREE.Object3D | null>(null);
    const { scene } = useThree();
    const { playSound } = useAudio();

    const [isTalking, setIsTalking] = useState(false);

    const walkToPlayer = () => {
        if (entity.goal !== 'follow') return;

        const player = scene.getObjectByName('player');
        if (player?.position) {
            const playerPosition = player?.position;
            walkTo([playerPosition.x + Math.random() * 2 - 1, 0, playerPosition.z + Math.random() * 2 - 1])
        } else {
            setTimeout(() => {
                walkToPlayer();
            }, 500);
        }
    };


    const walkTo = (position: [number, number, number]) => {
        updateEntity(id, { position: position });
    };

    useEffect(() => {
        if (entity.goal == 'follow') {
            walkToPlayer();
        }
    }, [entity.goal]);

    if (!scene) return null;

    return <><Ped
        key={name}
        basePath={entity.basePath || "/models/human/onimilio/"}
        modelUrl={entity.modelUrl || "rigged.glb"}
        position={position} height={1.5}
        lookTarget={{ current: moveTargetRef }}
        onDestinationReached={() => { updateEntity(id, { goal: 'idle' }); }}
    >
        <Html center position={[0, 2, 0]} zIndexRange={[5, 10]}>
            <pre className="text-xs bg-gray-800/70 w-[300px] rounded overflow-auto text-wrap">
                {Object.entries(entity).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n")}
            </pre>
        </Html>
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

const cube = {
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
} as SceneNode;

export default RoomSpecificGame;