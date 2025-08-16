
import Link from "next/link";
import DropDownPage from "../ui/DropDownPage";

import type { Metadata } from "next";

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
            <Link href="/" className="group">
                <h1 className="text-2xl font-bold mt-6 mb-4">
                    Pockit Game Corp
                </h1>
            </Link>

            <div className="text-left max-w-[320px] px-2 mb-6">

                Pockit Game Corp is an independent game studio. <br /><br />

                Founded in 2023 by veterans from Zynga and Rockstar Games, our team builds innovative games using cutting-edge technology.  <br /><br />

                Follow us on <a href="https://x.com/pockitmilady" target="_blank">X</a> for updates and announcements. <br /><br />
            </div>
        </DropDownPage>
    );
}

