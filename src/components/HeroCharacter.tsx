export default function HeroCharacter() {
  return (
    <video
      aria-label="Chrome vampire cat mascot"
      width={1152}
      height={792}
      className="animate-float h-[500px] w-auto object-cover"
      autoPlay
      muted
      loop
      playsInline
    >
      <source src="/vampire-cat.mov" type='video/quicktime; codecs="hvc1"' />
      <source src="/vampire-cat.webm" type='video/webm; codecs="vp9"' />
    </video>
  );
}
