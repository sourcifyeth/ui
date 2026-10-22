// AnimateOnScroll
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import VerifiedContracts from "./VerifiedContracts";
import WhatWeSolve from "./WhatWeSolve";
import HeroReadable from "./HeroReadable";
import SupportedChains from "./SupportedChains";
import Tooling from "./Tooling";
import FAQ from "./FAQ";
import Contact from "./Contact";
import Footer from "../../components/Footer";
import { LandingStatsProvider } from "./landingStats";

//////////////////////////////////
///////// MAIN COMPONENT /////////
//////////////////////////////////

const LandingPage = () => {
  const { pathname, hash, key } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // The Dataset Playground was a section here (/#dataset-playground). index.html sends that link to the new page
    // on a page load; this covers a hash change while the landing page is already open.
    if (hash === "#dataset-playground") {
      navigate("/dataset-playground", { replace: true });
      return;
    }
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
  }, [pathname, hash, key, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 w-full">
      <Header />
      {/* One place for the numbers that the hero and the "What we solve" cards share */}
      <LandingStatsProvider>
        <HeroReadable />
        <WhatWeSolve />
      </LandingStatsProvider>
      {/* Verified contract stats */}
      <section
        className="flex flex-col items-center px-4 md:px-8 bg-gray-100 py-12 md:py-20"
        id="contract-stats"
      >
        <VerifiedContracts />
      </section>
      <SupportedChains />

      <Tooling />

      <Contact />

      <FAQ />

      <Footer />
    </div>
  );
};

export default LandingPage;
