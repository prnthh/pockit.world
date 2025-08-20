"use client";

import DialogCollider from "@/shared/ped/DialogCollider";
import Ped from "@/shared/ped/ped";
import { ScenePortalContext } from "../ScenePortalProvider";
import { useContext } from "react";

const RoomSpecificGame = () => {
    const { scenePortal } = useContext(ScenePortalContext);
    return <>
        <scenePortal.In>
            <Ped
                key={'npc1'}
                basePath={"/models/human/onimilio/"}
                modelUrl={"rigged.glb"}
                position={[-2, 0, 1]} height={1.5}
            >
                <DialogCollider>
                    {(
                        <div className="rounded chatbox ">
                            <div className="bg-[#b9de77]">
                                I can't wait till the office is ready!
                            </div>
                        </div>
                    )}
                </DialogCollider>
            </Ped>
        </scenePortal.In>
    </>;

}

export default RoomSpecificGame;