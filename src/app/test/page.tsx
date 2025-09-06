
import Link from "next/link";
import DropDownPage from "../ui/DropDownPage";
import RoomSpecificGame from "./RoomGame";

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
        </DropDownPage>
    );
}
