import { CylinderCollider } from "@react-three/rapier";
import React, { useRef, useState, useEffect, DOMElement } from "react";

import { Html } from "@react-three/drei";

export default function DialogCollider({
    children,
    height = 1.4,
    radius = 1.5,
    onEnter,
    onExit
}: {
    children?: React.ReactNode,
    height?: number,
    radius?: number,
    onEnter?: () => void,
    onExit?: () => void
}) {
    const [dialogVisible, setDialogVisible] = useState(false);

    const handleIntersectionEnter = (event: any) => {
        const name = event?.other?.name || event?.other?.rigidBodyObject?.name
        if (name == 'player') {
            console.log("DialogCollider: Intersection Entered with", name);
            setDialogVisible(true);
            onEnter?.();
        }
    };


    return <>
        <CylinderCollider
            args={[height / 2, radius]}
            position={[0, (height / 2), 0]}
            sensor
            onIntersectionEnter={handleIntersectionEnter}
            onIntersectionExit={() => { setDialogVisible(false); onExit?.() }}
        />
        {dialogVisible && <Html sprite transform position={[0, height * 1.1, 0]} scale={0.05}>
            <div className="min-w-[250px] text-3xl text-yellow-300 text-center">
                {children || "Default Dialog Text"}
            </div>
        </Html>}
    </>
}


export const RevealTextByWord = ({ text, speed = 100, playSound }: { text: string, speed?: number, playSound?: (url: string) => void }) => {
    const words = text.split(" ");
    const [wordCount, setWordCount] = useState(0);

    useEffect(() => {
        setWordCount(0);
        if (!words.length) return;
        let cancelled = false;
        let i = 0;
        function showNextWord() {
            if (cancelled || i >= words.length) return;
            setWordCount(i + 1);
            playSound?.("/sound/click.mp3");

            let delay = speed;
            if (/[,.;:!?]$/.test(words[i])) delay = speed * 2;
            i++;
            if (i < words.length) {
                setTimeout(showNextWord, delay);
            }
        }
        showNextWord();
        return () => { cancelled = true; };
    }, [text, speed]);

    return (
        <div>
            {words.map((word, i) => (
                <span
                    key={i}
                    style={{
                        display: "inline-block",
                        transition: "transform 0.4s cubic-bezier(.5,1.5,.5,1)",
                        transform: i < wordCount ? "translateY(0)" : "translateY(-1em)",
                        opacity: i < wordCount ? 1 : 0,
                        marginRight: "0.25em"
                    }}
                >
                    {word}
                </span>
            ))}
        </div>
    );
}

export const DialogBox = ({ text, title, playSound }: { text: string, title?: string, playSound: (url: string) => void }) => {
    return <div className="select-none relative rounded rounded-3xl bg-[#b9de77aa] p-4 text-xl text-black scale-300 max-w-[400px] shadow-[inset_8px_8px_6px_-6px_#ffffffaa,inset_-8px_-8px_6px_-6px_#00000066,0_4px_12px_-6px_#00000066]">
        <div className="font-mono">
            <RevealTextByWord text={text} speed={200} playSound={playSound} />
        </div>
        {title && <div className="absolute -top-5 left-4 bg-[#b9de77] rounded px-2 border text-lg italic">
            {title}
        </div>}
    </div>
}