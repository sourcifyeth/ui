import React, { useState, useRef } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { FaMinus, FaPlus } from "react-icons/fa";

const FAQBox = ({ question, answer }: { question: string; answer: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section
      className={`flex flex-col w-full px-8 my-2 text-gray-700 bg-gray-50 rounded-lg shadow-lg transition-colors duration-500 ease-in-out`}
      id="faq"
    >
      <button
        className={`flex flex-row justify-between items-center text-left cursor-pointer py-6 ${
          isOpen ? "font-semibold" : ""
        }`}
        onClick={() => setIsOpen((currIsOpen) => !currIsOpen)}
        aria-expanded={isOpen}
        aria-controls={`faq-content-${question}`}
      >
        <div className="text-xl">{question}</div>
        <div className="">{isOpen ? <FaMinus /> : <FaPlus />}</div>
      </button>
      <AnimatePresence initial={false}>
        {
          <motion.div
            initial="collapsed"
            animate={`${isOpen ? "open" : "collapsed"}`}
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 },
            }}
            transition={{ duration: 0.8, ease: [0, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className=" text-gray-700 pb-6">{answer}</div>
          </motion.div>
        }
      </AnimatePresence>
    </section>
  );
};

export default function FAQ() {
  const faqRef = useRef(null);
  const isFAQInView = useInView(faqRef, { once: true });

  const FAQItems = [
    {
      q: 'What is "source-code verification"?',
      a: (
        <>
          <p className="mb-2">
            Smart contracts on Ethereum and other EVM blockchains are written in human-readable programming languages
            like Solidity, compiled into bytecode, and stored in bytes on the chain. Humans can't read bytes so this
            needs to be brought back to human-readable form.
          </p>
          <p className="mb-2">
            However, if you see a Solidity/Vyper code on Github etc., and someone claims this to be the code of the
            contract at 0xabc..def, you wouldn't know. Verification makes sure that, that Solidity code is actually the
            one deployed on-chain.
          </p>
          <p className="mb-2">
            In simplified terms, we take the Solidity/Vyper code provided by the developer or anyone, compile it, and
            compare the compiled bytecode with the onchain bytecode at that address 0xabc..def. If they match, the
            contract is verified.
          </p>
          <p className="mb-2 font-medium">
            Source code verification is crucial for transparency and security in blockchains. You should not interact
            with contracts that are not source-code verified.
          </p>
          <p className="mb-2">
            Verification does not mean it's safe to interact with a contract. Verifiers do not check the contents of the
            contracts. These should be cheked by auditors and the community to be deemed safe.
          </p>
        </>
      ),
    },
    {
      q: "How is Sourcify different than other verifiers?",
      a: (
        <>
          <ul className="list-disc pl-4">
            <li>Sourcify is fully open-source, self-hostable, and non-profit.</li>
            <li>We share our whole contract dataset publicly in modern data formats for community use.</li>
            <li>
              We also store all verified contracts on IPFS, which makes them available directly through the IPFS hash in
              the bytecode. See the{" "}
              <a href="https://playground.sourcify.dev/" target="_blank" rel="noreferrer" className="underline">
                playground
              </a>{" "}
              for more.
            </li>
            <li>
              Sourcify supports "exact match"es, which means the verified source-code is cryptographically guaranteed to
              be the same as the original one, even whitespaces, comments etc. See{" "}
              <a
                href="https://docs.sourcify.dev/docs/exact-match-vs-match/"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                docs
              </a>{" "}
              for more.
            </li>
          </ul>
        </>
      ),
    },
    {
      q: "How does Sourcify make money?",
      a: (
        <>
          Sourcify is a public good and non-profit project. It started under the Ethereum Foundation and now is part of
          the{" "}
          <a href="https://argot.org" target="_blank" rel="noreferrer" className="underline">
            Argot Collective
          </a>
          . It currently does not generate any revenue.
        </>
      ),
    },
    {
      q: "Isn't Sourcify a block explorer?",
      a: (
        <>
          <p className="mb-2">No. Sourcify's focus is contract verification only.</p>
          <p className="mb-2">
            Block explorers like Etherscan or Blockscout let users view all activity on the chain (transactions,
            blocks, accounts, and more), which requires significant infrastructure and indexing the chains,
            particularly difficult for chains with low block times.
          </p>
          <p className="mb-2">
            Sourcify is only concerned with deployed contracts and their source code. In fact, block explorers can use
            Sourcify as their verification backend, which is what Blockscout does.
          </p>
        </>
      ),
    },
    {
      q: "What is the Verifier Alliance?",
      a: (
        <>
          The Verifier Alliance is an ecosystem collective aiming for easy, unified, and open access to the source-code
          of EVM smart contracts. Sourcify and other verifiers collaborate to create a public shared database of
          verified EVM contracts, open up the siloed contract data, and create standards around the verifiation process.
          To learn more, visit{" "}
          <a href="https://verifieralliance.org" target="_blank" rel="noreferrer" className="underline">
            verifieralliance.org
          </a>
          .
        </>
      ),
    },
  ];

  return (
    <section ref={faqRef} className="w-full flex flex-col items-center py-16 bg-ceruleanBlue-100">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={isFAQInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
        className="text-6xl font-bold text-ceruleanBlue-500 mb-12"
      >
        F.A.Q.
      </motion.h2>
      <div className="w-full max-w-[64rem] px-4">
        {FAQItems.map((item, index) => (
          <FAQBox key={`faq-item-${index}`} question={item.q} answer={item.a} />
        ))}
      </div>
    </section>
  );
}
