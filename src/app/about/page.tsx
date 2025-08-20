
import DropDownPage from "../ui/DropDownPage";

import type { Metadata } from "next";
import RoomSpecificGame from "./RoomGame";
import PockitLogo from "../ui/PockitLogo";

export const metadata: Metadata = {
    title: "About | Pockit Game Corp",
    description: "Learn more about Pockit Game Corp, an independent game studio founded by veterans from Zynga and Rockstar Games.",
    openGraph: {
        type: 'website',
        title: 'About | Pockit Game Corp',
        description: 'Learn more about Pockit Game Corp, an independent game studio founded by veterans from Zynga and Rockstar Games.',
        url: 'https://pockit.world/about',
        images: 'https://pockit.world/ui/pockitlogo.png',
    },
    twitter: {
        card: 'summary',
        title: 'About | Pockit Game Corp',
        description: 'Learn more about Pockit Game Corp, an independent game studio founded by veterans from Zynga and Rockstar Games.',
        creator: '@pockitmilady',
        images: ["https://pockit.world/ui/pockitlogo.png"],
    }
};

export default function Home() {
    return (
        <DropDownPage>
            <PockitLogo />

            <div className="text-left max-w-[320px] px-2 mb-6">
                <div className="italic text-center w-full">
                    eternal pursuit of digital <a href="https://goldenlight.mirror.xyz/c4YPJ6Y0KMvhKlJDNmhmjNeMa-9BZc8VwelJeS0_51s" target="_blank">moe</a>
                </div>
                <br />

                Pockit Game Corp is an independent game studio building interactive experiences for the web. <br /><br />



                <a href="https://x.com/pockitmilady" target="_blank">
                    Follow us on X for updates and announcements
                </a>.
                <br />
            </div>

            <RoomSpecificGame />
        </DropDownPage>
    );
}

