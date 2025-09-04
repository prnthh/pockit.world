
import Link from "next/link";
import DropDownPage from "../ui/DropDownPage";
import RoomSpecificGame from "./RoomGame";
import dynamic from "next/dynamic";

const DynamicCryptoUser = dynamic(() => import("./CryptoProvider").then((mod) => mod.CryptoUser));

export default function Home() {
    return (
        <DropDownPage>
            <Link href="/" className="group">
                <h1 className="text-2xl font-bold mt-6 mb-4">
                    Pockit Test Corp
                </h1>
            </Link>

            <div className="text-left max-w-[320px] px-2 mb-6">
                This is a test page.
            </div>
            <RoomSpecificGame />

            {/* this internally fetches crypto data and uses it to populate the scene  */}
            <DynamicCryptoUser walletAddress="0x88289ac519eFb1cba5F522970E63264a969BeD06" />
        </DropDownPage>
    );
}
