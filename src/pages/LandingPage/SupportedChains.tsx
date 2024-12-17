import { Tooltip } from "react-tooltip";
import { useContext, useRef } from "react";
import { Context } from "../../Context";
import { DOCS_URL } from "../../constants";
import chains from "./chains";
import Button from "../../components/Button";
import { motion, useInView } from "framer-motion";

const SupportedChains = () => {
  const { sourcifyChains } = useContext(Context);
  const chainCount = sourcifyChains?.filter((c) => c.supported).length;

  const titleRef = useRef(null);
  const chainsRef = useRef(null);
  const bottomRef = useRef(null);

  const isTitleInView = useInView(titleRef, { once: true });
  const areChainsInView = useInView(chainsRef, { once: true });
  const isBottomInView = useInView(bottomRef, { once: true });

  return (
    <section className="px-8 md:px-12 lg:px-24 bg-gray-100 py-16 text-center">
      <motion.div
        ref={titleRef}
        initial={{ opacity: 0, y: 20 }}
        animate={isTitleInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        {chainCount ? (
          <h1 className="text-5xl text-ceruleanBlue-500 font-light ">
            <div className="text-9xl font-bold">{chainCount}</div> Chains
          </h1>
        ) : (
          <h1 className="text-5xl text-ceruleanBlue-500 font-bold">Supported Chains</h1>
        )}
      </motion.div>

      <Tooltip
        className="!rounded-xl !text-lg !bg-ceruleanBlue-100 !text-ceruleanBlue-600 !opacity-100 !px-6 !py-4 !z-50"
        id="supported-chains-tooltip"
      />
      <div className="flex flex-col w-full mb-8 mt-16" ref={chainsRef}>
        <div className="flex flex-row justify-center">
          {chains.slice(0, Math.ceil(chains.length / 2)).map((chain, index) => (
            <motion.img
              initial={{ opacity: 0 }}
              animate={
                areChainsInView
                  ? {
                      opacity: 1,
                      y: [0, 0, -20],
                      transition: { duration: 0.6, delay: index * 0.1 },
                    }
                  : { opacity: 0 }
              }
              whileHover={{ scale: 1.1, transition: { duration: 0.1, delay: 0 } }}
              key={chain.name}
              src={chain.logo}
              data-tooltip-id="supported-chains-tooltip"
              data-tooltip-content={chain.name}
              className={`h-12 md:h-24 hover:cursor-pointer mx-4 my-4 rounded-full`}
              alt={`${chain.name} logo`}
            />
          ))}
        </div>
        <div className="flex flex-row justify-center">
          {chains.slice(Math.ceil(chains.length / 2)).map((chain, index) => (
            <motion.img
              initial={{ opacity: 0 }}
              animate={
                areChainsInView
                  ? {
                      opacity: 1,
                      y: [0, 0, -20],
                      transition: { duration: 0.6, delay: (index + Math.ceil(chains.length / 2)) * 0.1 },
                    }
                  : { opacity: 0 }
              }
              whileHover={{ scale: 1.1, transition: { duration: 0.1, delay: 0 } }}
              key={chain.name}
              src={chain.logo}
              data-tooltip-id="supported-chains-tooltip"
              data-tooltip-content={chain.name}
              className={`h-12 md:h-24 hover:cursor-pointer mx-4 my-4 rounded-full`}
              alt={`${chain.name} logo`}
            />
          ))}
        </div>
      </div>
      <motion.div
        ref={bottomRef}
        initial={{ opacity: 0, y: 20 }}
        animate={isBottomInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="my-8 text-xl text-ceruleanBlue-500">
          <p>Sourcify works on all EVM based chains.</p>
        </div>
        <div className="flex justify-center">
          <a href={`${DOCS_URL}/docs/chains`}>
            <Button className="font-semibold">{`See all ${chainCount.toString() || ""} chains`}</Button>
          </a>
          <a href={`${DOCS_URL}/docs/chain-support/`}>
            <Button type="secondary" className="font-semibold ml-4">
              Add a new chain
            </Button>
          </a>
        </div>
      </motion.div>
    </section>
  );
};

export default SupportedChains;
