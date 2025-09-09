"use client";

import DialogCollider, { RevealTextByWord } from "@/shared/ped/DialogCollider";
import Ped from "@/shared/ped/ped";
import { ScenePortalContext } from "../ScenePortalProvider";
import { Suspense, useContext, useState } from "react";
import { useAudio } from "@/app/editor/scene/viewer/AudioProvider";
import { ShinyFloor } from "@/shared/shaders/ShinyFloor";
import { RigidBody } from "@react-three/rapier";
import HitBox from "@/shared/physics/HitBox";
import ImageFrame from "@/shared/shaders/ImageFrame";
import Balloon from "@/shared/physics/Balloon";

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

                                <RevealTextByWord text="The gallery is under construction! Please dont touch anything." speed={200} playSound={playSound} />
                            </div>

                        </div>
                    )}
                </DialogCollider>
            </Ped>
            <RigidBody position={[0, 0, 0]}>
                <ShinyFloor />
            </RigidBody>



            <Balloon position={[0, 6, -3]}>
                <mesh position={[0, -0.3, 0]}>
                    <pointLight position={[0, 0, 0]} intensity={20} decay={2} />
                    <sphereGeometry args={[0.1, 16, 16]} />
                    <meshStandardMaterial emissive={"white"} emissiveIntensity={10} />
                </mesh>
            </Balloon>
            {/* 
            <ImageRow
                key='left'
                urls={[
                    "https://i2.seadn.io/ethereum/0x3c9eab7168443e4c962a2bcfa983501b8894547e/949b62e646ad9b2e9f7827d6b8429a/3b949b62e646ad9b2e9f7827d6b8429a.gif?w=350",
                    "https://i2.seadn.io/ethereum/0x3c9eab7168443e4c962a2bcfa983501b8894547e/f23eda120a08bcbbaca0dbb80240f5/2bf23eda120a08bcbbaca0dbb80240f5.gif?w=350",
                    "https://i2.seadn.io/ethereum/0x3c9eab7168443e4c962a2bcfa983501b8894547e/51f8e8c27535b2ebd79a478896c4d9/1251f8e8c27535b2ebd79a478896c4d9.gif?w=350",
                    "https://i2.seadn.io/ethereum/0x3c9eab7168443e4c962a2bcfa983501b8894547e/dbea0e6a298d30f549fff86711895b/34dbea0e6a298d30f549fff86711895b.gif?w=350",
                ]}
                position={[-2.1, 1, 2]} rotation={[0, Math.PI / 2, 0]}
            />

            <ImageRow
                key='right'
                reverse
                urls={[
                    "https://i2.seadn.io/ethereum/0x3c9eab7168443e4c962a2bcfa983501b8894547e/8f9a9905cec209ca302d5741737f32/858f9a9905cec209ca302d5741737f32.gif?w=350",
                    "https://i2.seadn.io/ethereum/0x3c9eab7168443e4c962a2bcfa983501b8894547e/8b0a53d5e7e425298647e0d2c92579/758b0a53d5e7e425298647e0d2c92579.gif?w=350",
                    "https://i2.seadn.io/ethereum/0x3c9eab7168443e4c962a2bcfa983501b8894547e/1c3591b1d648103f79ae606a85bee0/da1c3591b1d648103f79ae606a85bee0.gif?w=350",
                    "https://i2.seadn.io/ethereum/0x3c9eab7168443e4c962a2bcfa983501b8894547e/ea8f13fef48707651d46900b4de468/bcea8f13fef48707651d46900b4de468.gif?w=350",
                ]}
                position={[2.1, 1, 2]} rotation={[0, -Math.PI / 2, 0]}
            />

            <ImageRow
                key='top'
                urls={[
                    "https://i2.seadn.io/ethereum/0x3c9eab7168443e4c962a2bcfa983501b8894547e/ca1da7a495b42963312046fa6fe829/9fca1da7a495b42963312046fa6fe829.gif?w=350",
                    "https://i2.seadn.io/ethereum/0x3c9eab7168443e4c962a2bcfa983501b8894547e/41d03976e0103f69a7415314754336/3e41d03976e0103f69a7415314754336.gif?w=350",
                    "https://i2.seadn.io/ethereum/0x3c9eab7168443e4c962a2bcfa983501b8894547e/d5c3cefbc3751d92052a6ab8e04636/2ad5c3cefbc3751d92052a6ab8e04636.gif?w=350",
                    "https://i2.seadn.io/ethereum/0x3c9eab7168443e4c962a2bcfa983501b8894547e/78acd8f584956c1a9f92a22c438d26/0278acd8f584956c1a9f92a22c438d26.gif?w=350",
                ]}
                position={[-2.4, 3, -8.5]} rotation={[0, 0, 0]}
            /> */}
        </scenePortal.In >
    </>;
}

export const ImageRow = ({
    urls = ["https://i2.seadn.io/ethereum/0x3c9eab7168443e4c962a2bcfa983501b8894547e/8f9a9905cec209ca302d5741737f32/858f9a9905cec209ca302d5741737f32.gif"],
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    reverse = false
}: {
    urls?: string[],
    position?: [number, number, number],
    rotation?: [number, number, number],
    reverse?: boolean
}) => {
    return (
        <group position={position} rotation={rotation}>
            {urls.map((url, index) => (
                <BreakableFrame key={index} url={url} position={[0 + index * 1.5 * (reverse ? -1 : 1), 0, 0]} />
            ))}
        </group>
    );
};

export const BreakableFrame = ({ url, position }: { url: string, position?: [number, number, number] }) => {
    const [broken, setBroken] = useState(false);
    return (
        <Suspense>
            <HitBox
                position={position}
                onHit={(hitCount) => {
                    if (hitCount > 0) {
                        setBroken(true);
                    }
                }}>
                <ImageFrame url={url} broken={broken} />
            </HitBox>
        </Suspense>
    );
};

export default RoomSpecificGame;