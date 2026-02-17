import Link from "next/link";
import type { Metadata } from "next";
import { NavButton3D } from "../NavButton3D";
import Minigame from "./minigame";
import { PockitViewer } from "./PockitViewer";

export const metadata: Metadata = {
    title: "Pockit Milady | 3D Interactive NFTs",
    description: "Pockit Milady is a collection of 1111 3D Interactive NFTs inspired by Milady Maker. Console in your Ethereum wallet.",
    openGraph: {
        type: 'website',
        title: 'Pockit Milady | 3D Interactive NFTs',
        description: 'Pockit Milady is a collection of 1111 3D Interactive NFTs inspired by Milady Maker. Console in your Ethereum wallet.',
        url: 'https://pockit.world/milady',
        images: 'https://pockit.world/ui/pockitlogo.png',
    },
    twitter: {
        card: 'summary',
        title: 'Pockit Milady | 3D Interactive NFTs',
        description: 'Pockit Milady is a collection of 1111 3D Interactive NFTs inspired by Milady Maker. Console in your Ethereum wallet.',
        creator: '@pockitmilady',
        images: ["https://pockit.world/ui/pockitlogo.png"],
    }
};

export default function Home() {
    return (
        <>
            <img src="/pockit.gif" alt="Pockit Milady" className="w-[300px]" />

            <Link href="/" className="group">
                <h1 className="text-2xl font-bold mt-6 mb-4">
                    Pockit Milady
                </h1>
            </Link>
            {/* <img src="/ui/pockitlogo.png" alt="Pockit Milady Logo" className="w-32" /> */}

            <div className="text-left w-[420px] px-2 mb-6 flex flex-col items-center">

                <div>
                    Pockit Milady is a collection of 1111 3D Interactive NFTs inspired by <a className="underline" href="https://miladymaker.net/">Milady Maker</a>. <br /><br />
                </div>


                Inspired by Tamagotchi, Gameboy and other retro portable consoles, Pockit is a console in your Ethereum wallet. <br /><br />

                <div>
                    You can buy a Pockit Milady on <a className="text-blue-600" href="https://opensea.io/collection/pockit-milady" target="_blank">OpenSea</a>.<br /><br />

                </div>

                <PockitViewer />


                <div className="mt-4">
                    The asset library is available <a className="underline" target="_blank" href="https://github.com/prnthh/moviemaker/tree/main/generation">here</a> under Viral Public License. <br /><br />
                </div>

                <hr className="w-full border-t-2 border-gray-300 my-4" />

                <a href="https://exo.cam/studio?utm_source=pockit.world&utm_medium=referral" target="_blank">
                    <img src="/ui/exocam-miladypockit.gif" alt="Pockit Milady" className="w-full rounded-lg mb-4" />
                    Exo Cam lets you view Pockit Milady in AR and make animated sequences!
                </a>

                <hr className="w-full border-t-2 border-gray-300 my-4" />

                <a href="https://milady.ai/?utm_source=pockit.world&utm_medium=referral" target="_blank" className="flex flex-col items-center">
                    <img src="/ui/miladyai.jpeg" alt="Milady AI" className="w-full rounded-lg mb-2" />
                    <span className="mt-1">Milady AI features Pockit Milady as your cute personal AI assistant — runs on your machine, always on, always yours.</span>
                </a>

                <hr className="w-full border-t-2 border-gray-300 my-4" />

                <Minigame />

            </div>
        </>
    );
}


