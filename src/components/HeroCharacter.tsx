import Image from "next/image";

export default function HeroCharacter() {
  return (
    <Image
      src="/vampire-cat.webp"
      alt="Chrome vampire cat mascot"
      width={768}
      height={528}
      loading="eager"
      unoptimized
      className="animate-float h-[500px] w-auto object-cover"
    />
  );
}
