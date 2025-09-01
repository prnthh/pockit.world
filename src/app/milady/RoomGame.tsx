"use client";

import DialogCollider, { RevealTextByWord } from "@/shared/ped/DialogCollider";
import Ped from "@/shared/ped/ped";
import { ScenePortalContext } from "../ScenePortalProvider";
import { useContext } from "react";
import { useAudio } from "@/app/editor/scene/viewer/AudioProvider";

const RoomSpecificGame = () => {
    const { scenePortal } = useContext(ScenePortalContext);
    const { playSound } = useAudio();

    return <>
        <scenePortal.In>
            <Ped
                key={'npc1'}
                basePath={"/models/human/pockit/"}
                modelUrl={"milady.glb"}
                position={[0, -5, -8]} height={1} scale={1}
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
        </scenePortal.In >
    </>;

}

export default RoomSpecificGame;