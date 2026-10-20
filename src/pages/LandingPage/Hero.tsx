import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import { DOCS_URL } from "../../constants";

// TEMPORARY: three hero variants to compare. Pick one with ?hero=a|b|c, then delete the others and the switcher.
type Variant = "a" | "b" | "c";
const VARIANTS: { id: Variant; name: string }[] = [
  { id: "a", name: "Plain" },
  { id: "b", name: "Highlighted" },
  { id: "c", name: "Glow" },
];
// The switcher never shows in production (REACT_APP_TAG=master)
const SHOW_SWITCHER = process.env.REACT_APP_TAG !== "master";

// The hero is shorter than the screen, so the tabs and the top of the cards show at the bottom of the first screen.
// 336px = header (about 112px) + tabs (about 64px) + the part of the cards that shows (about 160px).
const HERO_MIN_HEIGHT = "min-h-[calc(100svh-336px)]";

const Buttons = () => (
  <div
    className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mt-8 md:mt-10 opacity-0 animate-fade-up"
    style={{ animationDelay: "300ms" }}
  >
    <a href={process.env.REACT_APP_VERIFY_URL} target="_blank" rel="noopener noreferrer">
      <Button>Verify contract</Button>
    </a>
    <a href={DOCS_URL}>
      <Button type="secondary">Documentation</Button>
    </a>
  </div>
);

// A: the slogan as one plain, large sentence
const PlainSlogan = () => (
  <h1
    className="max-w-4xl text-4xl md:text-6xl font-bold leading-tight text-gray-800 opacity-0 animate-fade-up"
    style={{ animationDelay: "100ms" }}
  >
    Sourcify makes Ethereum verifiable, human-readable, and open-source by default.
  </h1>
);

// B: the three promises in Sourcify blue
const HighlightedSlogan = () => (
  <h1
    className="max-w-5xl text-4xl md:text-6xl font-bold leading-tight text-gray-800 opacity-0 animate-fade-up"
    style={{ animationDelay: "100ms" }}
  >
    Sourcify makes Ethereum <span className="text-ceruleanBlue-500">verifiable</span>,{" "}
    <span className="text-ceruleanBlue-500">human-readable</span>, and{" "}
    <span className="text-ceruleanBlue-500">open-source</span> by default.
  </h1>
);

// C: a small line above the slogan, on a soft blue glow with a dot grid
const GlowSlogan = () => (
  <>
    <div
      className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-medium text-ceruleanBlue-600 ring-1 ring-ceruleanBlue-100 opacity-0 animate-fade-up"
      style={{ animationDelay: "0ms" }}
    >
      Open-source · Open-data · Open-standards
    </div>
    <PlainSlogan />
  </>
);

const Hero = () => {
  const { search, pathname, hash } = useLocation();
  const navigate = useNavigate();
  const param = new URLSearchParams(search).get("hero");
  const variant: Variant = param === "b" || param === "c" ? param : "a";

  const setVariant = (id: Variant) => {
    const params = new URLSearchParams(search);
    params.set("hero", id);
    navigate({ pathname, search: params.toString(), hash }, { replace: true });
  };

  return (
    <section className={`relative ${HERO_MIN_HEIGHT} flex flex-col items-center justify-center px-4 py-12 text-center`}>
      {variant === "c" && (
        // Soft glow and dot grid. They fade out at all edges, so the hero blends into the page.
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 55% 50% at 50% 50%, rgba(43, 80, 170, 0.14), transparent 70%), radial-gradient(rgba(43, 80, 170, 0.18) 1px, transparent 1px) 0 0 / 22px 22px",
            // The mask reaches 0 before the top and bottom edge, so there is no hard line at the header or the tabs
            maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 75%)",
          }}
        />
      )}
      <div className="relative flex flex-col items-center">
        {variant === "a" && <PlainSlogan />}
        {variant === "b" && <HighlightedSlogan />}
        {variant === "c" && <GlowSlogan />}
        <Buttons />
      </div>

      {SHOW_SWITCHER && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-1 rounded-full bg-gray-900/90 p-1 pl-3 text-xs text-white shadow-lg">
          <span className="mr-1 text-gray-300">Hero</span>
          {VARIANTS.map(({ id, name }) => (
            <button
              key={id}
              type="button"
              onClick={() => setVariant(id)}
              className={`rounded-full px-3 py-1 ${variant === id ? "bg-white text-gray-900" : "hover:bg-white/10"}`}
            >
              {id.toUpperCase()} · {name}
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default Hero;
