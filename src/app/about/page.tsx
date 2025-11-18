
import DropDownPage from "../ui/DropDownPage";

import type { Metadata } from "next";
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

                1. Post authorship <br />
                2. White pill <br />
                3. Cypherpunk <br />
                4. Network spirituality <br />
                5. Post identity <br />
                6. God's little warriors <br />
                7. Cyberanarchism <br />
                8. Autodidacticism <br />
                9. Cybersteppe horde <br />
                9. Abundance mentality <br />
                10. Posting is the new art <br /><br />

                <a href="https://x.com/pockitmilady" target="_blank">
                    Follow us on X for updates and announcements
                </a>.
                <br />
            </div>

        </DropDownPage>
    );
}

