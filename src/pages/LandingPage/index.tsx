// AnimateOnScroll
import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import jsonLang from "react-syntax-highlighter/dist/esm/languages/prism/json";
import solidityLang from "react-syntax-highlighter/dist/esm/languages/prism/solidity";
import codeStyle from "react-syntax-highlighter/dist/esm/styles/prism/dracula";
import Button from "../../components/Button";
import Header from "../../components/Header";
import { DOCS_URL } from "../../constants";
import ChartSection from "./ChartSection";
import { bytecode, solidityCode } from "./example";
import AboutSection from "./AboutSection";
import SupportedChains from "./SupportedChains";
import Tooling from "./Tooling";
import FAQ from "./FAQ";
import Contact from "./Contact";
import { IoMdClose } from "react-icons/io";

SyntaxHighlighter.registerLanguage("solidity", solidityLang);
SyntaxHighlighter.registerLanguage("json", jsonLang);

//////////////////////////////////
///////// MAIN COMPONENT /////////
//////////////////////////////////

const LandingPage = () => {
  const [isHovering, setIsHovering] = useState(false);
  const animationRef = useRef<number>(null);
  const MAX_VELOCITY = 0.3;
  const MIN_VELOCITY = 0.1;
  const velocityRef = useRef({ x: MAX_VELOCITY, y: MAX_VELOCITY }); // Store velocity
  const positionRef = useRef({ x: 50, y: 50 }); // Store position
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const element = document.querySelector(".spotlight-effect") as HTMLElement;
    if (!element) return;

    const animate = () => {
      if (isHovering) return;

      // Update position based on velocity
      positionRef.current.x += velocityRef.current.x;
      positionRef.current.y += velocityRef.current.y;

      // Bounce off edges
      if (positionRef.current.x <= 20 || positionRef.current.x >= 80) {
        velocityRef.current.x *= -1;
        // Add some randomness to the bounce
        velocityRef.current.x =
          (Math.random() * (MAX_VELOCITY - MIN_VELOCITY) + MIN_VELOCITY) * Math.sign(velocityRef.current.x);
      }
      if (positionRef.current.y <= 20 || positionRef.current.y >= 80) {
        velocityRef.current.y *= -1;
        // Add some randomness to the bounce
        velocityRef.current.y =
          (Math.random() * (MAX_VELOCITY - MIN_VELOCITY) + MIN_VELOCITY) * Math.sign(velocityRef.current.y);
      }

      // Keep velocity within bounds
      velocityRef.current.x = Math.max(Math.min(velocityRef.current.x, 3), -3);
      velocityRef.current.y = Math.max(Math.min(velocityRef.current.y, 3), -3);

      // Apply position
      element.style.setProperty("--x", `${positionRef.current.x}%`);
      element.style.setProperty("--y", `${positionRef.current.y}%`);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovering]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 w-full">
      {isVisible && (
        <div className="bg-ceruleanBlue-500 text-white py-3 px-4 relative">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
            <p className="text-sm sm:text-base text-center">
              🚀 APIv2 is now available! Make the most of the information-rich responses{" "}
              <a
                href="https://docs.sourcify.dev/blog/apiv2-lookup-endpoints/"
                className="underline font-semibold hover:text-ceruleanBlue-100"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more →
              </a>
            </p>
            <button
              onClick={() => setIsVisible(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-ceruleanBlue-400 rounded-full transition-colors"
              aria-label="Close banner"
            >
              <IoMdClose className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      <Header />
      <section className="min-h-screen flex flex-col justify-center px-8 md:px-12 -mt-20 pt-20 max-w-7xl mx-auto">
        <div className="flex flex-col justify-center items-center">
          {/* Hero section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 flex-1 place-items-center">
            {/* Hero left */}
            <div className="flex flex-col justify-center text-center lg:text-left order-2 lg:order-1">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4">
                <div className="opacity-0 animate-fade-up" style={{ animationDelay: "400ms" }}>
                  Source Code Verification <br /> for{" "}
                  <span className="text-ceruleanBlue-500">Ethereum Smart Contracts</span>
                </div>
              </h1>
              <h2
                className="text-base md:text-xl font-semibold text-gray-500 opacity-0 animate-fade-up"
                style={{ animationDelay: "1500ms" }}
              >
                Open-source, open-data, open-standards
              </h2>
            </div>

            {/* Hero right */}
            <div
              className="relative h-72 w-72 md:h-96 md:w-[30rem] md:flex items-center justify-center opacity-0 animate-fade-up order-1 lg:order-2 mt-4 lg:mt-0"
              style={{ animationDelay: "100ms" }}
            >
              <div
                className="absolute h-72 w-72 md:h-96 md:w-[30rem] z-10 spotlight-effect rounded-xl overflow-hidden "
                style={{
                  maskImage: "radial-gradient(circle at var(--x, 50%) var(--y, 50%), transparent 80px, black 128px)",
                  WebkitMaskImage:
                    "radial-gradient(circle at var(--x, 50%) var(--y, 50%), transparent 80px, black 128px)",
                  background: "var(--code-bg, #1E1E1E)",
                }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onMouseMove={(e) => {
                  if (!isHovering) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  e.currentTarget.style.setProperty("--x", `${x}%`);
                  e.currentTarget.style.setProperty("--y", `${y}%`);
                }}
              >
                <div className="p-4 text-xs text-gray-100 break-all bg-[#111827]">{bytecode}</div>
              </div>
              <div className="absolute h-72 w-72 md:h-96 md:w-[30rem] rounded-xl overflow-hidden shadow-xl">
                <SyntaxHighlighter
                  language="solidity"
                  customStyle={{ margin: 0, background: "#111827" }}
                  style={codeStyle}
                  className="h-full w-full p-0 m-0 text-xs"
                >
                  {solidityCode}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
          {/* Buttons */}
          <div
            className="flex flex-col items-center justify-center sm:flex-row gap-2 md:gap-4 mt-4 lg:mt-12 opacity-0 animate-fade-up"
            style={{ animationDelay: "1700ms" }}
          >
            <Link to="/verifier">
              <Button className="uppercase mt-4">Verify Contract</Button>
            </Link>
            <a href={DOCS_URL}>
              <Button className="uppercase mt-4" type="secondary">
                Documentation
              </Button>
            </a>
          </div>
        </div>
      </section>

      <AboutSection />
      <SupportedChains />
      {/* Verified contract stats */}
      <section className="flex flex-col items-center px-8 md:px-12 lg:px-24 bg-gray-100 py-16">
        <ChartSection />
      </section>
      <Tooling />

      <Contact />

      <FAQ />

      {/* Footer */}
      <footer
        className="text-center md:text-left px-8 py-8 md:px-48 md:py-12 bg-ceruleanBlue-500 text-white text-lg"
        id="footer"
      >
        <nav className="font-vt323 flex flex-col flex-wrap gap-4 max-w-7xl mx-auto items-center">
          <div className="flex flex-col items-center text-xl">
            <div className="text-ceruleanBlue-200 flex flex-col md:flex-row flex-wrap justify-center gap-x-8">
              <a href="https://docs.sourcify.dev" className="hover:text-ceruleanBlue-100 block">
                Documentation
              </a>
              <a href="https://docs.sourcify.dev/docs/repository/" className="hover:text-ceruleanBlue-100 block">
                Contract Repository
              </a>
              <a href="https://github.com/orgs/ethereum/projects/46" className="hover:text-ceruleanBlue-100 block">
                Project Board
              </a>
              <a
                href="https://github.com/orgs/ethereum/projects/46/views/3"
                className="hover:text-ceruleanBlue-100 block"
              >
                Milestones
              </a>
              <a href="https://github.com/sourcifyeth/assets" className="hover:text-ceruleanBlue-100 block">
                Brand Resources
              </a>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <h3 className="uppercase font-bold text-ceruleanBlue-100 text-2xl">Socials</h3>
            <div className="flex flex-col md:flex-row flex-wrap gap-x-6 text-ceruleanBlue-200 justify-center">
              <a href="https://x.com/sourcifyeth" className="hover:text-ceruleanBlue-100 block">
                X (Twitter)
              </a>
              <a href="https://discord.gg/6aqd9cfZ9s" className="hover:text-ceruleanBlue-100 block">
                Discord
              </a>
              <a
                href="https://matrix.to/#/#ethereum_source-verify:gitter.im"
                className="hover:text-ceruleanBlue-100 block"
              >
                Matrix
              </a>
              <a href="https://github.com/ethereum/sourcify" className="hover:text-ceruleanBlue-100 block">
                GitHub (main)
              </a>
              <a href="https://github.com/sourcifyeth" className="hover:text-ceruleanBlue-100 block">
                GitHub (organization)
              </a>
              <a href="mailto:hello@sourcify.dev" className="hover:text-ceruleanBlue-100 block">
                E-Mail
              </a>
            </div>
          </div>
        </nav>
        <div className="text-center text-sm mt-8 text-ceruleanBlue-300">
          <div className="text-base mb-1">
            Made with ❤️ by{" "}
            <a
              href="https://argot.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ceruleanBlue-100 underline"
            >
              Argot Collective
            </a>{" "}
          </div>
          <div>{new Date().getFullYear()} • sourcify.eth</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
