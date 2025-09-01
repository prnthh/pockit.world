"use client";

import DialogCollider, { RevealTextByWord } from "@/shared/ped/DialogCollider";
import Ped from "@/shared/ped/ped";
import { ScenePortalContext } from "../ScenePortalProvider";
import { useContext, useEffect, useState } from "react";
import { useAudio } from "@/app/editor/scene/viewer/AudioProvider";
import CrawlerApp from "@/shared/ik/CrawlerPed";

const RoomSpecificGame = () => {
    const { scenePortal } = useContext(ScenePortalContext);
    const { playSound } = useAudio();

    return <>
        <scenePortal.In>
            <Ped
                key={'np21'}
                basePath={"/models/human/onimilio/"}
                modelUrl={"rigged.glb"}
                position={[1, 0, -1]} height={1.5}
            >
                <DialogCollider>
                    {(
                        <div className="rounded chatbox ">
                            <div className="bg-[#b9de77]">
                                Whats good
                                <RevealTextByWord text="The office is under construction! Please come back later." speed={200} playSound={playSound} />
                            </div>

                        </div>
                    )}
                </DialogCollider>
            </Ped>
            <CrawlerApp spawn={[0, -1, -8]} />

        </scenePortal.In>
    </>;
}

export default RoomSpecificGame;