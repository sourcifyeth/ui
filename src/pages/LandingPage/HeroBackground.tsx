// The hero background: a grid of small gray dots, 22px apart. It fades out before the edges of the hero,
// so there is no hard line at the header or the next section.
const DOTS = "radial-gradient(rgba(107, 114, 128, 0.22) 1px, transparent 1px) 0 0 / 22px 22px"; // gray-500
const FADE = "radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 75%)";

export default function HeroBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10"
      aria-hidden="true"
      style={{ background: DOTS, maskImage: FADE, WebkitMaskImage: FADE }}
    />
  );
}
