"use client";

import DialogCollider, { DialogBox, RevealTextByWord } from "@/shared/ped/DialogCollider";
import Ped from "@/shared/ped/ped";
import { ScenePortalContext } from "../ScenePortalProvider";
import { useContext } from "react";
import { useAudio } from "@/shared/AudioProvider";

const RoomSpecificGame = () => {
    const { scenePortal } = useContext(ScenePortalContext);
    const { playSound } = useAudio();

    return <>
        <scenePortal.In>
            <Ped
                key={'npc1'}
                basePath={"/models/human/onimilio/"}
                modelUrl={"rigged.glb"}
                position={[-2, 0, 1]} height={1.5}
            >
                <DialogCollider>
                    <DialogBox playSound={playSound} title={"Tour Guide"} text="I can't wait till the office is ready!" />
                </DialogCollider>
            </Ped>
        </scenePortal.In>
    </>;

}

export default RoomSpecificGame;