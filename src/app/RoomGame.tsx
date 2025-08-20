"use client";

import DialogCollider, { RevealTextByWord } from "@/shared/ped/DialogCollider";
import Ped from "@/shared/ped/ped";
import { useContext, useEffect, useState } from "react";
import { ScenePortalContext } from "./ScenePortalProvider";
import NetworkThing from "./NetworkThing";
import { useAudio } from "./AudioProvider";
import * as THREE from "three";

const RoomSpecificGame = () => {
    const { scenePortal } = useContext(ScenePortalContext);
    const { playSound } = useAudio();
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
                        <div className="rounded chatbox ">
                            <div className="bg-[#b9de77]">
                                <RevealTextByWord text="The office is under construction! Please come back later." speed={200} playSound={playSound} />
                            </div>
                        </div>
                    )}
                </DialogCollider>
            </Ped>
            <NetworkThing
                scale={new THREE.Vector3(0.03, 0.03, 0.03)}
                position={new THREE.Vector3(1.6, 0.64, 0.4)}
                modelUrl="/models/environment/Bell.glb"
                id="bell"
                onActivate={() => {
                    console.log('Bell activated');
                    playSound("/sound/click.mp3"); // Play remotely if soundUrl provided

                }}
            />
        </scenePortal.In>
    </>;

}

export default RoomSpecificGame;