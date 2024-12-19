// AnimateOnScroll
import { useContext, useRef, useState, useEffect } from "react";
import { BsCheckCircleFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import jsonLang from "react-syntax-highlighter/dist/esm/languages/prism/json";
import solidityLang from "react-syntax-highlighter/dist/esm/languages/prism/solidity";
import codeStyle from "react-syntax-highlighter/dist/esm/styles/prism/dracula";
import Button from "../../components/Button";
import Header from "../../components/Header";
import { DOCS_URL } from "../../constants";
import ChartSection from "./ChartSection";
import { Context } from "../../Context";
import { bytecode, solidityCode } from "./example";
import { FaEthereum } from "react-icons/fa";
import AboutSection from "./AboutSection";
import SupportedChains from "./SupportedChains";
import Tooling from "./Tooling";
import FAQ from "./FAQ";
import Contact from "./Contact";

SyntaxHighlighter.registerLanguage("solidity", solidityLang);
SyntaxHighlighter.registerLanguage("json", jsonLang);

type FooterItemProps = {
  href?: string;
  children: string;
};
const FooterItem = ({ href, children }: FooterItemProps) => (
  <a href={href}>
    <li className="text-ceruleanBlue-300 hover:text-ceruleanBlue-100">{children}</li>
  </a>
);

const A = ({ href, children }: FooterItemProps) => (
  <a href={href} className="text-ceruleanBlue-500 link-underline">
    {children}
  </a>
);
//////////////////////////////////
///////// MAIN COMPONENT /////////
//////////////////////////////////

const LandingPage = () => {
  const { sourcifyChains } = useContext(Context);
  const [isHovering, setIsHovering] = useState(false);
  const animationRef = useRef<number>(null);
  const MAX_VELOCITY = 0.3;
  const MIN_VELOCITY = 0.1;
  const velocityRef = useRef({ x: MAX_VELOCITY, y: MAX_VELOCITY }); // Store velocity
  const positionRef = useRef({ x: 50, y: 50 }); // Store position

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
      <Header />
      <section className="min-h-screen flex flex-col justify-center px-8 md:px-12 -mt-20 pt-20">
        <div className="flex flex-col justify-center items-center">
          {/* Hero section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 flex-1">
            {/* Hero left */}
            <div className="flex flex-col justify-center text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-4">
                <div className="opacity-0 animate-fade-up" style={{ animationDelay: "400ms" }}>
                  <div>Source Code</div>
                  <span className="relative">
                    Verification
                    <div
                      className="absolute -right-2 bottom-0 md:bottom-1 md:-right-4 bg-gray-100 rounded-full opacity-0 animate-fade-up"
                      style={{ animationDelay: "700ms" }}
                    >
                      <BsCheckCircleFill className="text-green-500 rotate-12 md:h-8 md:w-8 h-5 w-5" />
                    </div>
                  </span>
                </div>
                <div
                  className="text-2xl md:text-4xl my-2 opacity-0 animate-fade-up"
                  style={{ animationDelay: "800ms" }}
                >
                  for
                </div>
                <div className="flex flex-col gap-2 opacity-0 animate-fade-up" style={{ animationDelay: "1000ms" }}>
                  <div className="flex flex-row items-center justify-center md:justify-start gap-2">
                    <span>Ethereum</span>
                    <FaEthereum className="" />
                  </div>
                  <div>Smart Contracts</div>
                </div>
              </h1>
              <h2 className="text-lg opacity-0 animate-fade-up" style={{ animationDelay: "1500ms" }}>
                Open-source, open-data, open-standards
              </h2>
            </div>

            {/* Hero right */}
            <div
              className="hidden relative h-96 w-[30rem] md:flex items-center justify-center opacity-0 animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              <div
                className="absolute h-96 w-[30rem] z-10 spotlight-effect rounded-xl overflow-hidden "
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
              <div className="absolute h-96 w-[30rem] rounded-xl overflow-hidden shadow-xl">
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
            className="flex flex-col justify-center sm:flex-row gap-2 md:gap-4 mt-8 md:mt-12 opacity-0 animate-fade-up"
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
      <footer className="text-center md:text-left px-8 py-8 md:px-48 md:py-16 bg-ceruleanBlue-500 text-white text-xl">
        <nav className="font-vt323 grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="uppercase font-bold text-ceruleanBlue-100">Internal Links</h3>
            <ul>
              <FooterItem href="/verifier">Contract Verifier</FooterItem>
              <FooterItem href="/lookup">Contract Lookup</FooterItem>
              {/* <FooterItem href="/status">Server Status</FooterItem> */}
            </ul>
          </div>
          <div>
            <h3 className="uppercase font-bold text-ceruleanBlue-100">External Links</h3>
            <ul>
              <FooterItem href="https://docs.sourcify.dev">Documentation</FooterItem>
              <FooterItem href="https://docs.sourcify.dev/docs/repository/">Contract Repository</FooterItem>
              <FooterItem href="https://github.com/sourcifyeth/assets">Brand Resources</FooterItem>
            </ul>
          </div>
          <div>
            <h3 className="uppercase font-bold text-ceruleanBlue-100">Socials</h3>
            <ul>
              <FooterItem href="https://twitter.com/sourcifyeth">Twitter</FooterItem>
              <FooterItem href="https://discord.gg/6aqd9cfZ9s">Discord</FooterItem>
              <FooterItem href="https://matrix.to/#/#ethereum_source-verify:gitter.im">Matrix</FooterItem>
              <FooterItem href="https://github.com/ethereum/sourcify">GitHub (main)</FooterItem>
              <FooterItem href="https://github.com/sourcifyeth">GitHub (organization)</FooterItem>
              <FooterItem href="mailto:hello@sourcify.dev">E-Mail</FooterItem>
            </ul>
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
