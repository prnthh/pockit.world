'use client';

import Link from "next/link";
import { useRef, useEffect } from "react";

export default function PockitLogo() {
    const ctx = useRef<AudioContext | null>(null);
    const source = useRef<AudioBufferSourceNode | null>(null);
    const startTime = useRef(0);
    const buffer = useRef<AudioBuffer | null>(null);

    useEffect(() => {
        const audioCtx = new AudioContext();
        ctx.current = audioCtx;

        fetch('/sound/fluteup.mp3')
            .then(res => res.arrayBuffer())
            .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
            .then(buf => buffer.current = buf)
            .catch(() => { });
    }, []);

    const play = (buf: AudioBuffer | null, offset = 0) => {
        source.current?.stop();
        if (!ctx.current || !buf) return;
        const src = ctx.current.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.current.destination);
        src.start(0, offset);
        source.current = src;
    };

    const playSound = () => {
        startTime.current = ctx.current?.currentTime || 0;
        play(buffer.current);
    };

    const stopSound = () => {
        if (!ctx.current || !buffer.current) return;
        const elapsed = ctx.current.currentTime - startTime.current;
        const rev = ctx.current.createBuffer(buffer.current.numberOfChannels, buffer.current.length, buffer.current.sampleRate);
        for (let i = 0; i < buffer.current.numberOfChannels; i++) {
            const data = buffer.current.getChannelData(i);
            const revData = rev.getChannelData(i);
            for (let j = 0; j < data.length; j++) revData[j] = data[data.length - 1 - j];
        }
        play(rev, Math.max(0, rev.duration - elapsed));
    };

    return (
        <Link href="/" onPointerEnter={playSound} onPointerLeave={stopSound}>
            <img
                src='/ui/pockitlogo2.png'
                alt='Pockit Game Corp Logo'
                className="inline-block h-24 hover:cursor-pointer hover:brightness-110 hover:scale-115 transition-all ease-in hover:duration-600 active:duration-600 active:brightness-90 active:scale-95"
            />
        </Link>
    );
}
