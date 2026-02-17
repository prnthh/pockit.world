"use client";

import { useState } from "react";
import { ToyFrame } from "./ToyFrame";

export function PockitViewer() {
    const [id, setId] = useState(5);

    return (
        <div className="mb-4 flex flex-col items-center gap-3">
            <ToyFrame>
                <iframe
                    src={`https://prnth.com/Pockit/web/${id}.html`}
                    className="w-[400px] h-[380px] rounded-lg shadow-[0_0_2px_rgb(0,0,0)]"
                    title="Pockit Milady"
                />
            </ToyFrame>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-yellow-300 rounded-2xl px-4 py-2 shadow-[0_4px_20px_0px_rgba(0,0,0,0.2),_inset_0px_-2px_6px_3px_rgba(255,255,255,0.6)]">
                    <button
                        onClick={() => setId((v) => Math.max(1, v - 1))}
                        className="w-8 h-8 rounded-full bg-yellow-400 shadow-[0_3px_0_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.7)] active:shadow-[0_1px_0_rgba(0,0,0,0.2)] active:translate-y-[2px] font-bold text-lg leading-none select-none transition-transform"
                    >
                        −
                    </button>
                    <input
                        type="number"
                        min={1}
                        max={1111}
                        value={id}
                        onChange={(e) => {
                            const val = Math.min(1111, Math.max(1, Number(e.target.value)));
                            setId(val);
                        }}
                        className="w-20 text-center bg-yellow-100 rounded-xl px-2 py-1 text-base font-bold tracking-widest shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                        onClick={() => setId((v) => Math.min(1111, v + 1))}
                        className="w-8 h-8 rounded-full bg-yellow-400 shadow-[0_3px_0_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.7)] active:shadow-[0_1px_0_rgba(0,0,0,0.2)] active:translate-y-[2px] font-bold text-lg leading-none select-none transition-transform"
                    >
                        +
                    </button>
                </div>

                {/* Download buttons */}
                <div className="flex gap-2">
                    <a
                        href={`https://prnth.com/Pockit/web/${id}.vrm`}
                        download
                        className="flex items-center gap-1 bg-yellow-300 rounded-2xl px-3 py-2 text-xs font-bold shadow-[0_4px_20px_0px_rgba(0,0,0,0.2),_inset_0px_-2px_6px_3px_rgba(255,255,255,0.6)] active:translate-y-[2px] active:shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition-transform select-none whitespace-nowrap"
                    >
                        ⬇ VRM
                    </a>
                    <a
                        href={`https://prnth.com/Pockit/web/${id}.glb`}
                        download
                        className="flex items-center gap-1 bg-yellow-300 rounded-2xl px-3 py-2 text-xs font-bold shadow-[0_4px_20px_0px_rgba(0,0,0,0.2),_inset_0px_-2px_6px_3px_rgba(255,255,255,0.6)] active:translate-y-[2px] active:shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition-transform select-none whitespace-nowrap"
                    >
                        ⬇ GLB
                    </a>
                </div>
            </div>
        </div>
    );
}
