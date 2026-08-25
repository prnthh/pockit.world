import type { Metadata } from "next";
import Studio from "./Studio";

export const metadata: Metadata = {
  title: "Pockit Milady Studio",
  description: "Animate a Pockit Milady VRM with face and pose tracking.",
};

export default function PockitMiladyStudio() {
  return <Studio />;
}
