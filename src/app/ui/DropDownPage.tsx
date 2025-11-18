"use client";

import { useState } from "react";
import ScrollerUI from "../ui/Scroller";

export default function DropDownPage({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(true);
    return (
        <div className="absolute z-20 relative">
            <div className={`absolute w-screen h-screen overflow-hidden  ${collapsed ? '' : ' pointer-events-none '} items-center justify-center transition-all duration-300 ease-in-out`} onClick={() => setCollapsed(false)}>
                <div className={`border-white backdrop-blur-sm bg-white/80 pointer-events-auto absolute left-1/2 -translate-x-1/2 text-black rounded-xl shadow-[inset_0px_0px_4px_rgba(0,0,0,0.5)] flex flex-col items-center ${collapsed ? 'top-1/2 -translate-y-1/2' : '-top-0 -translate-y-[calc(100%-40px)] hover:-translate-y-[calc(100%-60px)]'} transition-all duration-300 ease-in-out`}
                    // onMouseEnter={() => setCollapsed(true)}
                    // onMouseLeave={() => setCollapsed(false)}
                    onClick={(e) => {
                        e.stopPropagation();
                        !collapsed && setCollapsed(true);
                    }}
                >
                    <div className="flex flex-col items-center max-h-[85vh] px-4 overflow-y-auto noscrollbar">
                        {children}

                    </div>
                    <ScrollerUI />
                </div>
            </div>

            {/* end main container */}
        </div>
    );
}
