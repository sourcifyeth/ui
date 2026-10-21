import { useContext, useRef, useState, useEffect } from "react";
import { Context } from "../../Context";
import { DOCS_URL } from "../../constants";
import chains from "./chains";
import { FiArrowRight } from "react-icons/fi";
import { motion, useInView } from "framer-motion";

const SupportedChains = () => {
  const { sourcifyChains } = useContext(Context);
  const chainCount = sourcifyChains?.filter((c) => c.supported).length;
  const [displayCount, setDisplayCount] = useState(0);

  const titleRef = useRef(null);
  const chainsRef = useRef(null);
  const bottomRef = useRef(null);

  const isTitleInView = useInView(titleRef, { once: true });
  const areChainsInView = useInView(chainsRef, { once: true });
  const isBottomInView = useInView(bottomRef, { once: true });

  useEffect(() => {
    if (chainCount && isTitleInView) {
      const duration = 1000; // 1 second for the animation
      const steps = 60; // Number of steps in the animation
      const increment = chainCount / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= chainCount) {
          setDisplayCount(chainCount);
          clearInterval(timer);
        } else {
          setDisplayCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [chainCount, isTitleInView]);

  return (
    <section className="px-4 md:px-8 bg-gray-100 py-12 md:py-20 text-center" id="supported-chains">
      <motion.div
        ref={titleRef}
        initial={{ opacity: 0, y: 20 }}
        animate={isTitleInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        {chainCount ? (
          <h2 className="text-4xl md:text-5xl text-ceruleanBlue-500 font-light ">
            <div className="text-8xl md:text-9xl font-bold">{displayCount}</div> Chains
          </h2>
        ) : (
          <h2 className="text-4xl md:text-5xl text-gray-800 font-bold">Supported Chains</h2>
        )}
      </motion.div>

      {/* The same chips as the Self Hosting block in the Tooling section */}
      <motion.ul
        ref={chainsRef}
        initial={{ opacity: 0, y: 16 }}
        animate={areChainsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.5 }}
        className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2 md:mt-12"
      >
        {chains.map((chain) => (
          <li
            key={chain.name}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 text-sm text-gray-700"
          >
            <img src={chain.logo} alt="" className="h-7 w-7 rounded-full bg-white object-contain" />
            {chain.name}
          </li>
        ))}
      </motion.ul>
      <motion.div
        ref={bottomRef}
        initial={{ opacity: 0, y: 20 }}
        animate={isBottomInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="my-4 md:my-8 text-base md:text-xl text-ceruleanBlue-500">
          <p>Sourcify works on all EVM based chains.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {/* The same link style as "Verify a contract" in the hero */}
          <a
            href={`${DOCS_URL}/docs/chains`}
            className="inline-flex items-center gap-1 font-semibold text-ceruleanBlue-500 link-underline"
          >
            {chainCount ? `See all ${chainCount} chains` : "See all chains"} <FiArrowRight aria-hidden="true" />
          </a>
        </div>
      </motion.div>
    </section>
  );
};

export default SupportedChains;
