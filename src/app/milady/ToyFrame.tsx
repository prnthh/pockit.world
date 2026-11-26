export function ToyFrame({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-3xl overflow-hidden bg-yellow-300 p-4 shadow-[0_4px_20px_0px_rgba(0,0,0,0.2),_inset_0px_-2px_6px_3px_rgba(255,255,255,0.6)]">
            {children}
        </div>
    );
}
