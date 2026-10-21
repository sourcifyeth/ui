import { useRef, useState, type ReactNode } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import bashLang from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import javascriptLang from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import codeStyle from "react-syntax-highlighter/dist/esm/styles/prism/dracula";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { FiCheck, FiCopy, FiTerminal } from "react-icons/fi";
import selfHostedInstancesData from "../../data/selfHostedInstances.json";

SyntaxHighlighter.registerLanguage("bash", bashLang);
SyntaxHighlighter.registerLanguage("javascript", javascriptLang);

// One code block in the card. The title is the window title: "terminal" or a file name.
type CodeBlock = { title: string; language: "bash" | "javascript"; code: string };

type Tool = {
  id: string;
  name: string;
  /** How this tool verifies, in a few words */
  how: string;
  icon: ReactNode;
  docs: { label: string; href: string };
  blocks?: CodeBlock[];
  video?: string;
};

const logo = (src: string, alt: string) => <img src={src} alt={alt} className="h-7 w-7 object-contain" />;

// Long commands are split with "\" so they never wrap inside a word
const TOOLS: Tool[] = [
  {
    id: "foundry",
    name: "Foundry",
    how: "forge verify-contract",
    icon: logo("/foundry.png", ""),
    docs: { label: "Foundry docs", href: "https://getfoundry.sh/reference/forge/verify-contract" },
    blocks: [
      {
        title: "terminal",
        language: "bash",
        code: `# Verify an already deployed contract
$ forge verify-contract --verifier sourcify \\
    --chain <chain-id> 0xB4239c86440d6C39d518D6457038cB404451529b MyContract

# Deploy and verify
$ forge create src/MyContract.sol:MyContract \\
    --rpc-url <rpc-url> --private-key <private-key> \\
    --verify --verifier sourcify

# Check a verification job
$ forge verify-check 64f6f3bb-2b93-40ec-b6e8-b6e90510e6b0 --verifier sourcify`,
      },
    ],
  },
  {
    id: "hardhat-3",
    name: "Hardhat 3",
    how: "hardhat verify",
    icon: logo("/hardhat.png", ""),
    docs: { label: "Hardhat docs", href: "https://hardhat.org/docs/guides/smart-contract-verification" },
    blocks: [
      {
        title: "terminal",
        language: "bash",
        code: `# Verify a contract
$ npx hardhat verify --network mainnet 0x1F98431c8aD98523631AE4a59f267346ea31F984`,
      },
    ],
  },
  {
    id: "hardhat-2",
    name: "Hardhat 2",
    how: "hardhat-verify plugin",
    icon: logo("/hardhat.png", ""),
    docs: {
      label: "Hardhat 2 docs",
      href: "https://v2.hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify#verifying-on-sourcify",
    },
    blocks: [
      {
        title: "hardhat.config.js",
        language: "javascript",
        code: `module.exports = {
  sourcify: {
    // No API key needed
    enabled: true,
  },
};`,
      },
      {
        title: "terminal",
        language: "bash",
        code: `$ npx hardhat verify --network mainnet 0x1F98431c8aD98523631AE4a59f267346ea31F984`,
      },
    ],
  },
  {
    id: "remix",
    name: "Remix",
    how: "Contract Verification plugin",
    icon: logo("/remix.png", ""),
    docs: { label: "Open the plugin in Remix", href: "https://remix.ethereum.org/?#activate=contract-verification" },
    video: "/remix-plugin.mp4",
  },
  {
    id: "api",
    name: "API",
    how: "Any language, over HTTP",
    icon: <FiTerminal className="h-6 w-6 text-gray-700" aria-hidden="true" />,
    docs: { label: "API docs", href: "https://docs.sourcify.dev/docs/api/" },
    blocks: [
      {
        title: "terminal",
        language: "bash",
        code: `# Verify with the Standard JSON input of the compiler
$ curl -X POST https://sourcify.dev/server/v2/verify/<chain-id>/<address> \\
    -H "Content-Type: application/json" \\
    -d '{
      "stdJsonInput": { "language": "Solidity", "sources": { ... }, ... },
      "compilerVersion": "0.8.28+commit.7893614a",
      "contractIdentifier": "contracts/MyContract.sol:MyContract"
    }'

# Check the verification job
$ curl https://sourcify.dev/server/v2/verify/<verification-id>`,
      },
    ],
  },
];

// Comments and the "$ " prompts are for reading, not for pasting into a terminal
function copyText(block: CodeBlock): string {
  if (block.language !== "bash") return block.code;
  return block.code
    .split("\n")
    .filter((line) => !line.startsWith("#") && line.trim() !== "")
    .map((line) => line.replace(/^\$ /, ""))
    .join("\n");
}

const codeStyleWithComments = {
  ...codeStyle,
  comment: { color: "#7b8ab8" },
  prolog: { color: "#7b8ab8" },
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-gray-100"
      aria-label={copied ? "Copied" : "Copy code"}
    >
      {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

// The window dots show only on the first bar of the card
const WindowBar = ({ title, dots = true, children }: { title: string; dots?: boolean; children?: ReactNode }) => (
  <div className="flex h-10 items-center justify-between border-b border-white/10 px-4">
    <div className="flex items-center gap-3">
      {dots && (
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        </div>
      )}
      <span className="font-mono text-xs text-gray-400">{title}</span>
    </div>
    {children}
  </div>
);

const ToolCard = ({ tool }: { tool: Tool }) => (
  // The code cards share one fixed height, so the page does not move between them.
  // The video card is as tall as the video at the full card width, so it stays readable.
  <div
    className={`flex flex-col overflow-hidden rounded-xl bg-[#111827] shadow-xl ring-1 ring-black/5 ${
      tool.video ? "" : "h-[26rem] md:h-[24rem]"
    }`}
  >
    <div className="min-h-0 flex-1 overflow-y-auto">
      {tool.blocks?.map((block, i) => (
        <div key={block.title + i} className={i > 0 ? "border-t border-white/10" : ""}>
          <WindowBar title={block.title} dots={i === 0}>
            <CopyButton text={copyText(block)} />
          </WindowBar>
          <SyntaxHighlighter
            language={block.language}
            style={codeStyleWithComments}
            customStyle={{ background: "transparent", margin: 0, padding: "1rem 1.25rem" }}
            className="text-xs leading-relaxed md:text-sm"
          >
            {block.code}
          </SyntaxHighlighter>
        </div>
      ))}
      {tool.video && (
        <>
          <WindowBar title="Remix · Contract Verification" />
          <div className="bg-black">
            <video
              src={tool.video}
              autoPlay
              loop
              muted
              playsInline
              aria-label="The Contract Verification plugin in Remix verifies a contract on Sourcify"
              className="block aspect-[800/434] w-full"
            />
          </div>
        </>
      )}
    </div>
    <div className="flex h-11 shrink-0 items-center border-t border-white/10 px-4">
      <a
        href={tool.docs.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-ceruleanBlue-200 hover:text-white"
      >
        {tool.docs.label} →
      </a>
    </div>
  </div>
);

export default function Tooling() {
  const [activeId, setActiveId] = useState(TOOLS[0].id);
  const active = TOOLS.find((t) => t.id === activeId) ?? TOOLS[0];
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();
  const fadeIn = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 16 }, animate: isInView ? { opacity: 1, y: 0 } : {}, transition: { duration: 0.5 } };
  const instances = [...selfHostedInstancesData].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className="w-full flex flex-col items-center text-gray-700 py-12 md:py-20 px-4" id="tooling" ref={sectionRef}>
      <motion.div {...fadeIn} className="mb-10 text-center md:mb-12">
        <h2 className="text-4xl md:text-5xl text-gray-800 font-bold">Tooling</h2>
        <p className="mt-3 text-base text-gray-600 md:text-lg">Verify from the tools you already use. No API key needed.</p>
      </motion.div>

      <motion.div {...fadeIn} className="grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-[15rem_1fr] md:gap-6">
        {/* Tool list: a column on desktop, a row of pills that scrolls sideways on phones */}
        <div
          role="tablist"
          aria-label="Tools"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0"
        >
          {TOOLS.map((tool) => {
            const isActive = tool.id === active.id;
            return (
              <button
                key={tool.id}
                type="button"
                role="tab"
                id={`tool-tab-${tool.id}`}
                aria-selected={isActive}
                aria-controls="tool-panel"
                onClick={(e) => {
                  setActiveId(tool.id);
                  // On phones the pills scroll sideways: keep the chosen one in view
                  e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
                }}
                className={`flex shrink-0 items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors md:py-3 ${
                  isActive
                    ? "border-ceruleanBlue-200 bg-white shadow-sm"
                    : "border-transparent hover:bg-white/60"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center">{tool.icon}</span>
                <span className="min-w-0">
                  <span className={`block font-semibold ${isActive ? "text-gray-900" : "text-gray-700"}`}>{tool.name}</span>
                  <span className="hidden font-mono text-xs text-gray-500 md:block">{tool.how}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id="tool-panel" aria-labelledby={`tool-tab-${active.id}`} className="min-w-0">
          <ToolCard tool={active} />
        </div>
      </motion.div>

      {/* Self-hosting */}
      <motion.div {...fadeIn} className="mt-16 w-full max-w-5xl rounded-xl bg-white p-6 ring-1 ring-gray-200 md:mt-20 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <h3 className="text-2xl font-bold text-gray-800">Self Hosting</h3>
            <p className="mt-2 text-gray-600">
              Sourcify is open source, so you can run your own instance. These public instances are known to us:
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <ul className="flex flex-wrap gap-2 md:justify-end">
              {instances.map((instance) => (
                <li key={instance.name}>
                  <a
                    href={`${instance.url}/api-docs/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 py-1 pl-1 pr-3 text-sm text-gray-700 hover:border-ceruleanBlue-200 hover:bg-white"
                  >
                    <img src={instance.logo} alt="" className="h-7 w-7 rounded-full bg-white object-contain" />
                    {instance.name}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="https://github.com/argotorg/sourcify/issues/new?template=self-hosted-instance.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-700 link-underline"
            >
              Running an instance? Add it to the list →
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
