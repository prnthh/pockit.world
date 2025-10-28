"use client";

import DialogCollider, { RevealTextByWord } from "@/shared/ped/DialogCollider";
import Ped from "@/shared/ped/ped";
import { ScenePortalContext } from "../ScenePortalProvider";
import { useContext } from "react";
import { useAudio } from "@/shared/AudioProvider";
import InteractiveSphere from "@/shared/shaders/InteractiveSphere";
import { RigidBody } from "@react-three/rapier";
import CrawlerApp from "@/shared/ik/CrawlerPed";

const RoomSpecificGame = () => {
    const { scenePortal } = useContext(ScenePortalContext);
    const { playSound } = useAudio();

    return <>
        <scenePortal.In>
            <Ped
                key={'npc1'}
                basePath={"/models/human/onimilio/"}
                modelUrl={"rigged.glb"}
                position={[-2, 0, 4]} height={1.5}
            >
                <DialogCollider>
                    {(
                        <div className="rounded chatbox ">
                            <div className="bg-[#b9de77]">
                                <RevealTextByWord text="I can't wait till the office is ready!" speed={200} playSound={playSound} />
                            </div>
                        </div>
                    )}
                </DialogCollider>
            </Ped>
            <InteractiveSphere />

            {/* terrain  */}
            <RigidBody>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                    <planeGeometry args={[100, 100]} />
                    <meshStandardMaterial color="lightblue" />
                </mesh>
            </RigidBody>

            <CrawlerApp spawn={[0, 4, 10]} />
        </scenePortal.In>
    </>;

}

export default RoomSpecificGame;