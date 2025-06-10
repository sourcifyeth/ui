import { useState, useRef, useEffect } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import bashLang from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import javascriptLang from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import codeStyle from "react-syntax-highlighter/dist/esm/styles/prism/dracula";
import { motion, useInView } from "framer-motion";
import integrationsData from "../../data/integrations.json";
import selfHostedInstancesData from "../../data/selfHostedInstances.json";
import Button from "../../components/Button";

// Register languages
SyntaxHighlighter.registerLanguage("bash", bashLang);
SyntaxHighlighter.registerLanguage("javascript", javascriptLang);

export default function Tooling() {
  const [activeTab, setActiveTab] = useState("foundry");
  const integrationsRef = useRef(null);
  const areIntegrationsInView = useInView(integrationsRef, { once: true });
  const selfHostedRef = useRef(null);
  const areSelfHostedInView = useInView(selfHostedRef, { once: true });
  const [displayedCode, setDisplayedCode] = useState("");
  const codeRef = useRef(null);
  const isCodeInView = useInView(codeRef, { once: true });
  const titleRef = useRef(null);
  const tabsRef = useRef(null);
  const isTitleInView = useInView(titleRef, { once: true });
  const areTabsInView = useInView(tabsRef, { once: true });

  const tabs = ["foundry", "hardhat", "remix"];
  const integrations = integrationsData;
  const selfHostedInstances = selfHostedInstancesData;

  const foundryExample = `# Deploy and verify
$ forge create --rpc-url <rpc-url> --private-key <private-key> src/MyContract.sol:MyContract --verify --verifier sourcify

# Verify an already deployed contract
$ forge verify-contract --verifier sourcify --chain <chain-id> 0xB4239c86440d6C39d518D6457038cB404451529b MyContract 

# Check if a contract is verified
$ forge verify-check 0x1F98431c8aD98523631AE4a59f267346ea31F984 --verifier sourcify
  `;

  const hardhatExampleJS = `// Enable Sourcify in your hardhat.config.js
module.exports = {
  sourcify: {
    // Doesn't need an API key
    enabled: true
  }
};`;

  const hardhatExampleBash = `# Verify a contract
$ npx hardhat verify --network mainnet 0x1F98431c8aD98523631AE4a59f267346ea31F984
`;

  const customStyle = {
    ...codeStyle,
    comment: {
      color: "#4C6FC4",
    },
    operator: {
      color: "#ff79c6",
    },
  };

  // Add typing effect when code is in view
  useEffect(() => {
    if (isCodeInView) {
      const codeToType =
        activeTab === "foundry"
          ? foundryExample
          : activeTab === "hardhat"
          ? hardhatExampleJS + hardhatExampleBash // Combined JS and Bash examples. We'll split the string in the code component.
          : "";

      let i = -1;
      setDisplayedCode("");

      const typingInterval = setInterval(() => {
        if (i < codeToType.length) {
          i++; // If i++ is not before the state update, it skips the second character.
          setDisplayedCode((prev) => prev + codeToType.charAt(i));
        } else {
          clearInterval(typingInterval);
        }
      }, 3);

      return () => clearInterval(typingInterval);
    }
  }, [isCodeInView, activeTab, foundryExample, hardhatExampleJS, hardhatExampleBash]);

  return (
    <section className="w-full flex flex-col items-center text-gray-700" id="tooling">
      <motion.h1
        ref={titleRef}
        initial={{ opacity: 0, y: 20 }}
        animate={isTitleInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
        className="text-6xl text-ceruleanBlue-500 font-bold text-center mb-10"
      >
        Tooling
      </motion.h1>

      <motion.div
        ref={tabsRef}
        initial={{ opacity: 0, y: 20 }}
        animate={areTabsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:inline-flex md:flex-row rounded-full"
      >
        {tabs.map((tab, index) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, scale: activeTab === tab ? 1.1 : 1 }}
            transition={{ duration: 0.3 }}
            className={`px-6 py-2 text-lg transition-colors flex items-center gap-2 relative
              ${index === 0 ? "rounded-l-full" : ""}
              ${index === tabs.length - 1 ? "rounded-r-full" : ""}
              ${
                activeTab === tab
                  ? "font-bold transform -translate-y-0.5"
                  : "font-medium text-gray-500 hover:text-gray-700"
              }`}
          >
            <motion.img
              src={`/${tab}.png`}
              alt={`${tab} logo`}
              initial={{ scale: 0.8 }}
              animate={{ scale: activeTab === tab ? 1 : 0.8 }}
              transition={{ duration: 0.2 }}
              className={`w-10 h-10 ${activeTab === tab ? "" : "opacity-50"}`}
            />
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 w-full h-0.5 bg-lightCoral-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        className="my-6 rounded-lg md:w-[60rem] px-4 max-w-full overflow-x-auto"
        ref={codeRef}
        initial={{ opacity: 0, y: 20 }}
        animate={isCodeInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        {activeTab === "foundry" && (
          <>
            <div className="mb-4 text-center">
              <a
                href="https://book.getfoundry.sh/reference/forge/forge-verify-contract"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg text-ceruleanBlue-500 hover:text-ceruleanBlue-600 link-underline font-medium"
              >
                Foundry Documentation →
              </a>
            </div>
            <SyntaxHighlighter
              language="bash"
              style={customStyle}
              customStyle={{ background: "#111827" }}
              className="text-xs lg:text-base min-h-80 max-w-full"
              codeTagProps={{
                className: "break-all sm:break-normal",
              }}
              wrapLongLines
            >
              {isCodeInView ? displayedCode : foundryExample}
            </SyntaxHighlighter>
          </>
        )}
        {activeTab === "hardhat" && (
          <>
            <div className="mb-4 text-center">
              <a
                href="https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify#verifying-on-sourcify"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg text-ceruleanBlue-500 hover:text-ceruleanBlue-600 link-underline font-medium"
              >
                Hardhat Documentation →
              </a>
            </div>
            <SyntaxHighlighter
              language="javascript"
              style={codeStyle}
              customStyle={{ background: "#111827" }}
              className="text-xs lg:text-base w-full min-h-48"
              codeTagProps={{
                className: "break-all sm:break-normal",
              }}
            >
              {isCodeInView ? displayedCode.slice(0, hardhatExampleJS.length) : hardhatExampleJS}
            </SyntaxHighlighter>
          </>
        )}
        {activeTab === "hardhat" && (
          <SyntaxHighlighter
            language="bash"
            style={codeStyle}
            customStyle={{ background: "#111827" }}
            className="text-xs lg:text-base w-full min-h-24"
            codeTagProps={{
              className: "break-all sm:break-normal",
            }}
          >
            {isCodeInView ? displayedCode.slice(hardhatExampleJS.length) : hardhatExampleBash}
          </SyntaxHighlighter>
        )}
        {activeTab === "remix" && (
          <div className="flex flex-col justify-center">
            <div className="mb-4 text-center">
              <a
                href="https://remix.ethereum.org/?#activate=contract-verification"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg text-ceruleanBlue-500 hover:text-ceruleanBlue-600 link-underline font-medium"
              >
                Try it in Remix →
              </a>
            </div>
            <div className="my-2 text-xl text-center">
              Use the "Contract Verification" plugin to verify on Sourcify and others.
            </div>
            <video src="/remix-plugin.mp4" autoPlay loop muted playsInline className="" />
          </div>
        )}
      </motion.div>

      <div className="my-24 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-ceruleanBlue-500">Who's using</h2>
        <div className="flex flex-wrap justify-center gap-2 md:gap-8 mt-12 mx-2" ref={integrationsRef}>
          {integrations
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((integration, index) => (
              <motion.a
                initial={{ opacity: 0 }}
                animate={
                  areIntegrationsInView
                    ? {
                        opacity: 1,
                        y: [0, 0, -20],
                        transition: { duration: 0.6, delay: index * 0.1 },
                      }
                    : { opacity: 0 }
                }
                whileHover={{ scale: 1.1, transition: { duration: 0.1, delay: 0 } }}
                href={integration.url}
                target="_blank"
                rel="noopener noreferrer"
                key={integration.name}
                className="w-16 flex flex-col items-center text-center"
              >
                <img
                  src={integration.logo}
                  alt={integration.name}
                  className={`w-10 md:w-14 ${integration.name !== "Blockscout" ? "rounded-full" : ""} ${
                    integration.name === "Wake" ? "bg-[#0000ff] p-2" : ""
                  }`}
                />
                <div className="text-gray-700 text-xs md:text-sm mt-1 text-wrap">{integration.name}</div>
              </motion.a>
            ))}
        </div>
      </div>

      <div className="text-center mx-4">
        <h2 className="text-4xl md:text-6xl font-bold text-ceruleanBlue-500 mb-4">Self-hosting</h2>
        <p className="text-base md:text-lg text-gray-600 mb-12">
          Sourcify is open-source and for self-hosting. Here are some public instances we are aware of:
        </p>
        <div className="flex flex-wrap justify-center gap-2 md:gap-8 mt-12 mx-2" ref={selfHostedRef}>
          {selfHostedInstances
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((instance, index) => (
              <motion.a
                initial={{ opacity: 0 }}
                animate={
                  areSelfHostedInView
                    ? {
                        opacity: 1,
                        y: [0, 0, -20],
                        transition: { duration: 0.6, delay: index * 0.1 },
                      }
                    : { opacity: 0 }
                }
                whileHover={{ scale: 1.1, transition: { duration: 0.1, delay: 0 } }}
                href={instance.url + "/health"}
                target="_blank"
                rel="noopener noreferrer"
                key={instance.name}
                className="w-16 flex flex-col items-center text-center"
              >
                <img src={instance.logo} alt={instance.name} className="w-10 h-10 md:w-14 md:h-14 rounded-full" />
                <div className="text-gray-700 text-xs md:text-sm mt-1 text-wrap">{instance.name}</div>
              </motion.a>
            ))}
        </div>
        <div className="mb-8 mt-4">
          <div className="text-gray-500 mb-2 text-sm">Are you running a self-hosted instance?</div>
          <a
            href="https://github.com/ethereum/sourcify/issues/new?template=self-hosted-instance.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="font-semibold">Add your instance</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
