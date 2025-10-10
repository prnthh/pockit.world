"use client";
import React from "react";

export default function PockitConsole() {

    const [toggled, setToggled] = React.useState(false);
    return (
        <iframe
            onMouseEnter={() => setToggled(true)}
            onMouseLeave={() => setToggled(false)}
            className={`fixed bottom-2 transition-all ${toggled ? "right-2" : "-right-[300px]"} w-[400px] h-[220px]`}
            src="https://toy.pockit.world"
            id="pockitconsole"
            title="PockitConsole"
        ></iframe>
    );
}
