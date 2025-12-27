const ScrollerUI = () => {
    return <div className="relative w-full h-10 overflow-hidden border-2 border-green-400 rounded bg-black/90 shadow-lg">
        <div className="animate-scroll flex items-center px-2 min-w-max">
            {(() => {
                const messages = [
                    "Pockit is an experiment in living art.",
                    "Pockit is a weekly online gala.",
                    "Pockit is an on-chain game console.",
                    "Pockit is an automatic movie maker.",
                    "Pockit is an agentic workspace simulation.",
                    "Pockit is a programming language.",
                    "Pockit is the final metaverse.",
                    "Pockit is a proof-of-concept kit."
                ];
                return [0, 1].map(repeat =>
                    messages.map((text, i) => (
                        <span key={`scroll${repeat + 1}-${i}`} className="scroll-item font-mono text-green-400 text-lg tracking-widest drop-shadow-lg flex-shrink-0">{text}</span>
                    ))
                );
            })()}
        </div>
    </div>;
}

export default ScrollerUI;