
import Link from "next/link";
import DropDownPage from "../ui/DropDownPage";

import type { Metadata } from "next";

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
        <DropDownPage>
            <Link href="/" className="group">
                <h1 className="text-2xl font-bold mt-6 mb-4">
                    Pockit Game Corp
                </h1>
            </Link>

            <div className="text-left max-w-[320px] px-2 mb-6">

                Pockit Milady is a collection of 1111 3D Interactive NFTs inspired by <a href="https://miladymaker.net/">Milady Maker</a>. <br /><br />

                <img src="/pockit.gif" alt="Pockit Milady" className="w-full rounded-lg mb-4" />

                Inspired by Tamagotchi, Gameboy and other retro portable consoles, Pockit is a console in your Ethereum wallet. <br /><br />

                You can buy a Pockit Milady on <a href="https://opensea.io/collection/pockit-milady" target="_blank">OpenSea</a> or <a href="https://sudoswap.xyz/#/browse/buy/0x3c9eab7168443e4c962a2bcfa983501b8894547e" target="_blank">SudoSwap</a>. <br /><br />

                <div>
                    <iframe src="https://prnth.com/Pockit/web/5.html" className="w-full h-[300px] rounded-lg mb-4" title="Pockit Milady"></iframe>
                </div>
                The asset library is available <a target="_blank" href="https://github.com/prnthh/moviemaker/tree/main/generation">here</a> under Viral Public License.

            </div>
        </DropDownPage>
    );
}

