"use client";

import DialogCollider from "@/shared/ped/DialogCollider";
import Ped from "@/shared/ped/ped";
import { ScenePortalContext } from "../ ScenePortalProvider";
import { useContext } from "react";

const RoomSpecificGame = () => {
    const { scenePortal } = useContext(ScenePortalContext);
    return <>
        <scenePortal.In>
            <Ped
                key={'np21'}
                basePath={"/models/human/onimilio/"}
                modelUrl={"rigged.glb"}
                position={[2.4, 0, 1]} height={1.5}
            >
                <DialogCollider>
                    {(
                        <div className="min-w-[400px] text-3xl text-yellow-300 text-center p-2 rounded drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
                            The office is under construction! <br />
                            Please come back later.
                        </div>
                    )}
                </DialogCollider>
            </Ped>
        </scenePortal.In>
    </>;

}

export default RoomSpecificGame;