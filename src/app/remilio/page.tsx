import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pockit Remilio",
  description: "Customize and export your Pockit Remilio character.",
};

export default function PockitRemilio() {
  return (
    <div className="h-dvh w-full shrink-0 overflow-hidden pt-18">
      <iframe
        src="/remilio/index.html"
        title="Pockit Remilio character editor"
        className="block h-full w-full border-0"
      />
    </div>
  );
}
