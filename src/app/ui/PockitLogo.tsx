import Link from "next/link";

export default function PockitLogo() {
    return <Link href="/">
        <h1 className="text-2xl font-bold mt-4 mb-4">
            <img src='/ui/pockitlogo.png' alt='Pockit Game Corp Logo' className="inline-block h-32" />
        </h1>
    </Link>
}
