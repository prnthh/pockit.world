import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Remilio Maker",
  description: "Customize and export your Pockit Remilio character.",
};

export default function PockitRemilio() {
  return (
    <iframe
      src="/remilio/index.html"
      title="Remilio Maker"
      className="block h-full w-full border-0"
    />
  );
}
