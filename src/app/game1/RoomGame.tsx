"use client";

import DialogCollider, { DialogBox, RevealTextByWord } from "@/shared/ped/DialogCollider";
import Ped from "@/shared/ped/ped";
import { ScenePortalContext } from "../ScenePortalProvider";
import { useContext } from "react";
import { useAudio } from "@/shared/AudioProvider";
import InteractiveSphere from "@/shared/shaders/InteractiveSphere";
import CrawlerApp from "@/shared/ik/CrawlerPed";
import Terrain from "@/shared/physics/Terrain";

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
                    <DialogBox playSound={playSound} title={"Tour Guide"} text="I can't wait till the office is ready!" />
                </DialogCollider>
            </Ped>
            <InteractiveSphere position={[-2, 1, 4]} />
            <Terrain />

            <CrawlerApp spawn={[0, 4, 10]} />
        </scenePortal.In>
    </>;

}

export default RoomSpecificGame;