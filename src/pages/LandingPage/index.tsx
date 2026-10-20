// AnimateOnScroll
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../../components/Header";
import VerifiedContracts from "./VerifiedContracts";
import WhatWeSolve from "./WhatWeSolve";
import HeroReadable from "./HeroReadable";
import SupportedChains from "./SupportedChains";
import Tooling from "./Tooling";
import FAQ from "./FAQ";
import Contact from "./Contact";
import BigQueryExplorer from "../../components/BigQueryExplorer";

//////////////////////////////////
///////// MAIN COMPONENT /////////
//////////////////////////////////

const LandingPage = () => {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    // Handle direct route to dataset-playground
    if (pathname === "/dataset-playground") {
      const element = document.getElementById("dataset-playground");
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (hash !== "") {
      setTimeout(() => {
        const id = hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
          });
        }
      }, 100);
    }
  }, [pathname, hash, key]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 w-full">
      <Header />
      <HeroReadable />
      <WhatWeSolve />
      {/* Verified contract stats */}
      <section
        className="flex flex-col items-center px-8 md:px-12 lg:px-24 bg-gray-100 py-12 md:py-20"
        id="contract-stats"
      >
        <VerifiedContracts />
      </section>
      <SupportedChains />

      <div id="dataset-playground">
        <BigQueryExplorer />
      </div>

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
              <a href="https://docs.sourcify.dev/blog/" className="hover:text-ceruleanBlue-100 block">
                Blog
              </a>
              <a href="https://docs.sourcify.dev/docs/repository/" className="hover:text-ceruleanBlue-100 block">
                Contract Repository
              </a>
              <a href="https://github.com/orgs/argotorg/projects/33" className="hover:text-ceruleanBlue-100 block">
                Project Board
              </a>
              <a
                href="https://github.com/orgs/argotorg/projects/33/views/3"
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
              <a href="https://github.com/argotorg/sourcify" className="hover:text-ceruleanBlue-100 block">
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
          <a
            href="https://drpc.org?ref=7ef756"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mb-4"
          >
            <img
              width={218}
              height={54}
              src="https://drpc.org/images/external/powered-by-drpc-light.svg"
              alt="Powered by dRPC"
            />
          </a>
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
