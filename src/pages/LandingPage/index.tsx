// AnimateOnScroll
import AOS from "aos";
import "aos/dist/aos.css";
import { useContext, useRef, useState, RefObject, useEffect } from "react";
import { BsCheckCircleFill, BsChevronCompactDown } from "react-icons/bs";
import { HiCheckCircle } from "react-icons/hi";
import { Link } from "react-router-dom";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import jsonLang from "react-syntax-highlighter/dist/esm/languages/prism/json";
import solidityLang from "react-syntax-highlighter/dist/esm/languages/prism/solidity";
import codeStyle from "react-syntax-highlighter/dist/esm/styles/prism/dracula";
import ReactTooltip from "react-tooltip";
import arbitrum from "../../assets/chains/arbitrum.svg";
import avalanche from "../../assets/chains/avalanche.png";
import bsc from "../../assets/chains/binance.png";
import boba from "../../assets/chains/boba.png";
import celo from "../../assets/chains/celo.png";
import ethereum from "../../assets/chains/ethereum.png";
import optimism from "../../assets/chains/optimism.svg";
import polygon from "../../assets/chains/polygon.webp";
import xdai from "../../assets/chains/xdai.png";
import decode from "../../assets/decode.gif";
import openSourceDecentralized from "../../assets/openSourceDecentralized.svg";
import verification from "../../assets/verification.svg";
import discord from "../../assets/discord.svg";
import matrix from "../../assets/matrix.svg";
import Button from "../../components/Button";
import Header from "../../components/Header";
import { DOCS_URL, REPOSITORY_SERVER_URL_FULL_MATCH } from "../../constants";
import ChartSection from "./ChartSection";
import sourceCode from "./Contract.sol";
import CustomCarousel from "./CustomCarousel";
import metadata from "./metadata.json";
import PoweredBySourcify from "./PoweredBySourcify";
import ToolsPlugin from "./ToolsPlugin";
import { Context } from "../../Context";
import { bytecode, solidityCode } from "./example";
import ethereumLogo from "../../assets/chains/ethereum.png";
import { FaEthereum } from "react-icons/fa";

AOS.init({
  duration: 800,
  once: true,
});

SyntaxHighlighter.registerLanguage("solidity", solidityLang);
SyntaxHighlighter.registerLanguage("json", jsonLang);

// Helper components

type ResourceListItemProps = {
  children: string;
  href: string;
  date?: string;
};
const ResourceListItem = ({ children, href, date }: ResourceListItemProps) => (
  <li>
    <a href={href} className="colored-bullet text-gray-600 hover:text-ceruleanBlue-500">
      <span className="link-underline">{children}</span>{" "}
      {date && <span className="text-gray-400 text-sm">{"- " + date}</span>}
    </a>
  </li>
);
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
  const [showMoreReadResources, setShowMoreReadResources] = useState(false);
  const [showMoreWatchResources, setShowMoreWatchResources] = useState(false);
  const { sourcifyChains } = useContext(Context);
  const [isHovering, setIsHovering] = useState(false);
  const animationRef = useRef<number>();
  const MAX_VELOCITY = 0.3;
  const MIN_VELOCITY = 0.1;
  const velocityRef = useRef({ x: MAX_VELOCITY, y: MAX_VELOCITY }); // Store velocity
  const positionRef = useRef({ x: 50, y: 50 }); // Store position

  const aboutRef = useRef<HTMLElement>(null);

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

  const scrollIntoView = (ref: RefObject<HTMLElement>) => {
    const el = ref?.current;
    if (!el) {
      return;
    }
    el.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header className="px-24 h-24" />
      <section className="min-h-screen flex flex-col justify-center px-8 md:px-12 -mt-20 pt-20">
        <div className="flex flex-col justify-center items-center">
          {/* Hero section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 flex-1">
            {/* Hero left */}
            <div className="flex flex-col justify-center">
              <h1 className="text-2xl md:text-7xl font-bold mb-4">
                <div className="opacity-0 animate-fade-up" style={{ animationDelay: "400ms" }}>
                  <div>Source Code</div>
                  <span className="relative">
                    Verification
                    <div
                      className="absolute bottom-1 -right-4 bg-gray-100 rounded-full opacity-0 animate-fade-up"
                      style={{ animationDelay: "700ms" }}
                    >
                      <BsCheckCircleFill className="text-green-500 rotate-12" size={30} />
                    </div>
                  </span>
                </div>
                <div className="text-4xl my-2 opacity-0 animate-fade-up" style={{ animationDelay: "800ms" }}>
                  for
                </div>
                <div className="flex flex-col gap-2 opacity-0 animate-fade-up" style={{ animationDelay: "1000ms" }}>
                  <div className="flex flex-row items-center gap-2">
                    <span>Ethereum</span>
                    <FaEthereum className="" />
                  </div>
                  <div>Smart Contracts</div>
                </div>
              </h1>
              <h2 className="text-lg opacity-0 animate-fade-up" style={{ animationDelay: "1500ms" }}>
                Open-source, open-data, decentralized
              </h2>
            </div>

            {/* Hero right */}
            <div
              className="relative h-96 w-[30rem] flex items-center justify-center opacity-0 animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              <div
                className="absolute h-96 w-[30rem] z-10 spotlight-effect rounded-xl overflow-hidden "
                style={{
                  maskImage: "radial-gradient(circle at var(--x, 50%) var(--y, 50%), transparent 64px, black 128px)",
                  WebkitMaskImage:
                    "radial-gradient(circle at var(--x, 50%) var(--y, 50%), transparent 64px, black 128px)",
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
                <div className="p-4 text-xs md:text-sm text-gray-100 break-all bg-[rgb(40,42,54)]">{bytecode}</div>
              </div>
              <div className="absolute h-96 w-[30rem] rounded-xl overflow-hidden shadow-xl">
                <SyntaxHighlighter
                  language="solidity"
                  customStyle={{ margin: 0 }}
                  style={codeStyle}
                  className="h-full w-full p-0 m-0 text-xs md:text-sm"
                >
                  {solidityCode}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
          {/* Buttons */}
          <div
            className="flex flex-col justify-center sm:flex-row gap-4 mt-12 opacity-0 animate-fade-up"
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

      {/* About section */}
      <section className="px-8 md:px-12 lg:px-48 bg-white py-16" ref={aboutRef} id="about">
        <div className="mt-12">
          <div className="flex items-center flex-col md:flex-row">
            <div className="flex-1" data-aos="fade-right">
              <img
                src={openSourceDecentralized}
                alt="Illustration depicting open source and decentralized development"
                className="w-64 md:w-auto md:pr-48 md:pl-8 -scale-x-100"
              />
            </div>
            <div className="flex-1 mt-4 md:mt-0" data-aos="fade-left">
              <h1 className="text-2xl text-ceruleanBlue-500 font-bold">Fully open-source and decentralized</h1>{" "}
              <p className="text-lg mt-4">
                Sourcify's code is fully open-sourced. The repository of verified contracts is completely public and
                decentralized by being served over{" "}
                <A href="https://docs.sourcify.dev/docs/repository/file-repositories/#ipfs">IPFS</A>.
              </p>
            </div>
          </div>
        </div>
        <div className="my-24 md:text-right">
          <div className="flex items-center flex-col-reverse md:flex-row">
            <div className="flex-1  mt-4 md:mt-0" data-aos="fade-right">
              <h1 className="text-2xl text-ceruleanBlue-500 font-bold">Next-level smart contract verification</h1>{" "}
              <p className="text-lg mt-4">
                <A href="https://docs.sourcify.dev/docs/full-vs-partial-match/">Full matches</A> on Sourcify
                cryptographically guarantee the verified source code is identical to the original deployed contract. Our
                monitoring service observes contract creations and verifies the source codes automatically if published
                to IPFS.
              </p>
            </div>
            <div className="flex-1" data-aos="fade-left">
              <img
                src={verification}
                alt="Illustration of contract verification"
                className="w-48 md:w-auto md:pr-48 md:pl-8 max-h-80"
              />
            </div>
          </div>
        </div>
        <div className="mb-12" data-aos="fade-left">
          <div className="flex items-center flex-col md:flex-row">
            <div className="flex-1 flex md:justify-end  mt-4 md:mt-0" data-aos="fade-right">
              <img src={decode} alt="Decoding contract interaction with Sourcify" className="md:pl-48 md:pr-8" />
            </div>
            <div className="flex-1 mt-4 md:mt-0" data-aos="fade-left">
              <h1 className="text-2xl text-ceruleanBlue-500 font-bold">Human-readable contract interactions</h1>
              <p className="text-lg">
                Goodbye <i>YOLO signing</i> 👋. Decode contract interactions with the verified contract's ABI and{" "}
                <A href="https://docs.soliditylang.org/en/develop/natspec-format.html">NatSpec comments</A> . Show
                wallet users meaningful information instead of hex strings.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-8 md:px-12 lg:px-24 bg-ceruleanBlue-500 py-16">
        <div className="mt-4 flex flex-col md:flex-row items-center justify-center">
          <div className="flex-1 mb-8 md:mb-0 md:pr-8 text-center md:text-left" data-aos="fade-right">
            <h1 className="text-3xl text-white font-bold">Get in touch</h1>
            <p className="text-lg text-white mt-4">Join our community using the platform you prefer</p>
          </div>

          <div className="flex-1 flex flex-col items-center" data-aos="fade-left">
            <a
              href="https://matrix.to/#/#ethereum_source-verify:gitter.im"
              rel="noreferrer"
              target="_blank"
              className="bg-white rounded-xl p-4 w-64 mb-4 text-center"
            >
              <img src={matrix} alt="Matrix logo" className="w-28 m-auto" style={{ height: "35px" }} />
            </a>

            <a
              href="https://discord.gg/6aqd9cfZ9s"
              rel="noreferrer"
              target="_blank"
              className="bg-white rounded-xl p-4 w-64 mb-4 text-center"
            >
              <img src={discord} alt="Discord logo" className="w-28 m-auto" style={{ height: "35px" }} />
            </a>

            <a
              href="irc://irc.w3.org:6667/#sourcify"
              className="bg-white rounded-xl font-bold p-4 w-64 mb-4 text-center"
              style={{ fontSize: "1.2rem" }}
            >
              #IRC
            </a>

            <a className="bg-white rounded-xl font-bold p-4 w-64 text-center" href="mailto:hello@sourcify.dev">
              hello@sourcify.dev
            </a>
          </div>
        </div>
      </section>

      {/* Supported Networks */}
      <section className="px-8 md:px-12 lg:px-24 bg-gray-100 py-16" data-aos="fade">
        <h1 className="text-3xl text-ceruleanBlue-500 font-bold">Supported Chains</h1>
        <div className="mt-8 text-lg">
          <p>Sourcify is multi-chain and works on all EVM based networks.</p>
          {sourcifyChains.length > 0 && (
            <p> Currently we support {sourcifyChains.filter((c) => c.supported).length} different chains </p>
          )}
        </div>
        <ReactTooltip effect="solid" />
        <div className="flex flex-row w-full justify-center py-16 logos-container flex-wrap">
          <img
            src={ethereum}
            data-tip="Ethereum"
            className="h-12 md:h-24 transition-opacity mx-4 my-4 "
            alt="Ethereum logo"
          />
          <img
            src={arbitrum}
            data-tip="Arbitrum"
            className="h-12 md:h-24 transition-opacity mx-4 my-4"
            alt="Arbitrum logo"
          />
          <img
            src={avalanche}
            data-tip="Avalanche"
            className="h-12 md:h-24 transition-opacity mx-4 my-4"
            alt="Avalanche logo"
          />
          <img
            src={bsc}
            data-tip="Binance Smart Chain"
            className="h-12 md:h-24 transition-opacity mx-4 my-4 rounded-full"
            alt="Binance Smart Chain logo"
          />
          <img
            src={boba}
            data-tip="Boba Network"
            className="rounded-full h-12 md:h-24 transition-opacity mx-4 my-4"
            alt="Boba network logo"
          />
          <img src={celo} data-tip="Celo" className="h-12 md:h-24 transition-opacity mx-4 my-4" alt="Celo logo" />
          <img
            src={xdai}
            data-tip="Gnosis Chain (xDai)"
            className="h-12 md:h-24 transition-opacity mx-4 my-4 rounded-full"
            alt="Gnosis chain (xDai) logo"
          />
          <img
            src={polygon}
            data-tip="Polygon"
            className="h-12 md:h-24 transition-opacity mx-4 my-4"
            alt="Polygon logo"
          />
          <img
            src={optimism}
            data-tip="Optimism"
            className="h-12 md:h-24 transition-opacity mx-4 my-4"
            alt="Optimism logo"
          />
          <div className="p-1 h-14 w-14 text-xs md:text-base md:h-24 md:w-24 transition-opacity rounded-full mx-4 my-4 text-ceruleanBlue-400 flex justify-center items-center text-center">
            <a href={`${DOCS_URL}/docs/chains`}>And many more!</a>
          </div>
        </div>
        <div className="flex justify-center">
          <a
            href={`${DOCS_URL}/docs/chains`}
            // className="underline decoration-lightCoral-500 decoration-2 font-semibold text-ceruleanBlue-500"
            className="link-underline font-semibold text-ceruleanBlue-500"
          >
            See all {sourcifyChains.length > 0 && sourcifyChains.length} chains
          </a>
        </div>
      </section>

      {/* Integrations & Tools */}
      <section className="px-8 md:px-12 lg:px-24 bg-white py-16" data-aos="fade">
        <h1 className="text-3xl text-ceruleanBlue-500 font-bold">Integrations</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12 text-center md:text-left">
          <div className="w-full">
            <PoweredBySourcify />
            <ToolsPlugin />
          </div>
          <div className="flex mt-12">
            <CustomCarousel />
          </div>
        </div>
        <div className="mt-12">
          <h3 className="text-center text-xl font-semibold text-ceruleanBlue-800">
            Want to integrate Sourcify into your project?
          </h3>
          <div className="flex justify-center">
            <a href={DOCS_URL}>
              <Button className="uppercase mt-4">Check Docs</Button>
            </a>
            <a href="https://gitter.im/ethereum/source-verify">
              <Button type="secondary" className="ml-4 uppercase mt-4">
                Get in touch
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Verified contract stats */}
      <section className="flex flex-col items-center px-8 md:px-12 lg:px-24 bg-gray-100 py-16" data-aos="fade">
        <ChartSection />
      </section>

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
          Sourcify Team • {new Date().getFullYear()} • sourcify.eth{" "}
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
