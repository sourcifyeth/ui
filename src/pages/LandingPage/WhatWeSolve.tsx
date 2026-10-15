import { Fragment, ReactNode, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  FaArrowRight,
  FaCheckCircle,
  FaDownload,
  FaFileSignature,
  FaGithub,
  FaHashtag,
  FaPause,
  FaUserShield,
} from "react-icons/fa";
import { IoCheckmarkDoneCircle } from "react-icons/io5";
import { IconType } from "react-icons";
import SourceBytecodeSlider from "./SourceBytecodeSlider";
import ClearSigningExample from "./ClearSigningExample";
import solidityLogo from "../../assets/languages/solidity.svg";
import vyperLogo from "../../assets/languages/vyper.svg";
import feLogo from "../../assets/languages/fe.svg";

// How long each card stays in front before the stack rotates
const ROTATE_MS = 7000;
// How far each card behind the front card peeks out above it
const PEEK_PX = 22;

const ExternalLink = ({ href, children }: { href?: string; children: ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-ceruleanBlue-500 font-medium link-underline whitespace-nowrap"
  >
    {children} →
  </a>
);

// Dark panel that shows the problem as raw data next to its readable form
const Visual = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div
    className={`bg-[#111827] text-gray-100 rounded-xl p-5 font-mono text-xs shadow-inner ring-1 ring-white/10 ${className}`}
  >
    {children}
  </div>
);

// "Used by" row: small logo and name of each user, linked to its website
const UsedBy = ({ users }: { users: { name: string; logo: string; url: string }[] }) => (
  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-700">
    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Used by</span>
    {users.map(({ name, logo, url }) => (
      <a
        key={name}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 hover:text-ceruleanBlue-500"
      >
        <img src={logo} alt="" className="h-5 w-5 rounded object-contain" />
        {name}
      </a>
    ))}
  </div>
);

type Problem = {
  id: string;
  title: string;
  badge?: string;
  icon: IconType;
  // Size and colors of the icon box. The default is Sourcify blue.
  iconClassName?: string;
  // One paragraph per entry
  text: string[];
  // Shown under the paragraphs
  afterText?: ReactNode;
  links?: ReactNode;
  visual: ReactNode;
  extra?: ReactNode;
};

const problems: Problem[] = [
  {
    id: "verification",
    title: "Source Code Verification",
    // Same icon and green as the "Exact Match" badge on repo.sourcify.dev
    icon: IoCheckmarkDoneCircle,
    iconClassName: "bg-green-100 text-green-800 border border-green-200 text-2xl",
    text: [
      "Sourcify's main service.",
      "We verify source code of contracts to make sure they match the bytecode.",
    ],
    afterText: (
      <ul className="flex flex-col gap-3 text-[15px]">
        <li>
          <div className="font-semibold text-gray-800">Open Source</div>
          <div className="text-gray-700">Sourcify is and always will be 100% open source.</div>
          <div className="mt-0.5 text-xs">
            <ExternalLink href="https://github.com/argotorg/sourcify">
              <span className="inline-flex items-center gap-1">
                <FaGithub aria-hidden="true" /> GitHub
              </span>
            </ExternalLink>
          </div>
        </li>
        <li>
          <div className="font-semibold text-gray-800">Open Data</div>
          <div className="text-gray-700">We publish our whole database daily.</div>
          <div className="mt-0.5 text-xs">
            <ExternalLink href="https://docs.sourcify.dev/docs/repository/">
              <span className="inline-flex items-center gap-1">
                <FaDownload aria-hidden="true" /> Download the dataset
              </span>
            </ExternalLink>
          </div>
        </li>
        <li>
          <div className="font-semibold text-gray-800">Open Standards</div>
          <div className="text-gray-700">We share data and standards with other verifiers.</div>
          <div className="mt-0.5 text-xs">
            <ExternalLink href="https://verifieralliance.org">Verifier Alliance</ExternalLink>
          </div>
        </li>
      </ul>
    ),
    visual: (
      <div className="flex flex-col gap-4">
        <SourceBytecodeSlider />
        <div className="flex flex-wrap items-center justify-end gap-y-2 text-gray-700">
          {[
            { name: "Solidity", logo: solidityLogo, url: "https://soliditylang.org" },
            { name: "Vyper", logo: vyperLogo, url: "https://vyperlang.org" },
            { name: "Fe", logo: feLogo, url: "https://fe-lang.org" },
          ].map(({ name, logo, url }, index) => (
            <span key={name} className={`px-4 last:pr-0 ${index > 0 ? "border-l border-gray-300" : ""}`}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-ceruleanBlue-500"
              >
                {/* Same box for every logo, so they show at the same size */}
                <img src={logo} alt="" className="h-5 w-5 object-contain" />
                {name}
              </a>
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "4byte",
    title: "4byte Database",
    icon: FaHashtag,
    text: [
      "Sourcify runs the largest EVM function/event/error signatures database.",
      "It combines signatures from verified contracts with imported collections.",
    ],
    links: (
      <span className="text-base">
        <ExternalLink href="https://4byte.sourcify.dev">4byte.sourcify.dev</ExternalLink>
      </span>
    ),
    visual: (
      <Visual>
        {/* Real hashes: the 4-byte selector of a function or error, and the 32-byte topic of an event (shortened) */}
        <div className="grid grid-cols-[auto_auto_1fr] items-baseline gap-x-3 gap-y-4">
          {[
            { kind: "Function", hash: "0xa9059cbb", name: "transfer(address,uint256)" },
            { kind: "Event", hash: "0xd78ad95f…d822", name: "Swap(address,uint256,uint256,uint256,uint256,address)" },
            { kind: "Error", hash: "0xe450d38c", name: "ERC20InsufficientBalance(address,uint256,uint256)" },
          ].map(({ kind, hash, name }) => (
            <Fragment key={kind}>
              <div>
                <div className="font-sans text-[10px] uppercase tracking-wider text-gray-500">{kind}</div>
                <div className="text-gray-400 whitespace-nowrap">{hash}</div>
              </div>
              <FaArrowRight className="text-ceruleanBlue-300 self-end mb-1" aria-hidden="true" />
              <div className="text-green-300 self-end">
                {/* Allow line breaks after commas, so long signatures wrap cleanly */}
                {name.split(",").map((part, i, parts) => (
                  <Fragment key={i}>
                    {part}
                    {i < parts.length - 1 && (
                      <>
                        ,<wbr />
                      </>
                    )}
                  </Fragment>
                ))}
              </div>
            </Fragment>
          ))}
        </div>
      </Visual>
    ),
    // Known users of the signature database, from the Sourcify usage reports
    extra: (
      <UsedBy
        users={[
          { name: "Foundry", logo: "/foundry.png", url: "https://getfoundry.sh" },
          { name: "viem", logo: "/users/viem.png", url: "https://viem.sh" },
          { name: "Remix", logo: "/remix.png", url: "https://remix.ethereum.org" },
          { name: "L2BEAT", logo: "/users/l2beat.png", url: "https://l2beat.com" },
          { name: "MetaMask", logo: "/users/metamask.png", url: "https://metamask.io" },
        ]}
      />
    ),
  },
  {
    id: "clear-signing",
    title: "ERC7730 Clear Signing",
    icon: FaFileSignature,
    text: [
      "Blind signing is Ethereum's biggest UX issue.",
      "We maintain the ERC7730 registry, move the spec forward and build tooling to foster adoption.",
    ],
    links: (
      <>
        <ExternalLink href="https://eips.ethereum.org/EIPS/eip-7730">ERC-7730 spec</ExternalLink>
        <ExternalLink href="https://github.com/ethereum/clear-signing-erc7730-registry">ERC-7730 registry</ExternalLink>
        <ExternalLink href="https://github.com/sourcifyeth/clear-signing">TypeScript SDK</ExternalLink>
      </>
    ),
    visual: <ClearSigningExample />,
    extra: (
      <UsedBy
        users={[
          { name: "Ledger", logo: "/users/ledger.png", url: "https://www.ledger.com" },
          { name: "Trezor", logo: "/users/trezor.png", url: "https://trezor.io" },
          { name: "Ambire", logo: "/users/ambire.png", url: "https://www.ambire.com" },
        ]}
      />
    ),
  },
  {
    id: "onay",
    title: "Onay: 2FA for Signing",
    badge: "New · in development",
    icon: FaUserShield,
    text: [
      "Your wallet is the only screen between you and a signature. Most people press confirm and hope.",
      "Onay is 2FA for signing. It gets the same transaction as your wallet, checks the source code and chain state locally, and shows what the transaction does. It holds no keys and signs nothing.",
    ],
    links: (
      <>
        <ExternalLink href="https://docs.sourcify.dev/blog/onay-local-signing-companion/">Read more</ExternalLink>
        <ExternalLink href="https://github.com/sourcifyeth/onay">GitHub</ExternalLink>
      </>
    ),
    visual: (
      <Visual className="font-sans">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="border border-gray-700 rounded p-2">
            <div className="text-gray-400 text-xs mb-1">Wallet</div>
            <div className="font-mono">0x3f9a…c21e</div>
          </div>
          <div className="border border-gray-700 rounded p-2">
            <div className="text-gray-400 text-xs mb-1">Onay</div>
            <div className="font-mono">0x3f9a…c21e</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 text-green-400 font-semibold">
          <FaCheckCircle aria-hidden="true" /> Same transaction, safe to sign
        </div>
      </Visual>
    ),
  },
];

const Card = ({ item, isFront }: { item: Problem; isFront: boolean }) => {
  const Icon = item.icon;
  return (
    <div className="relative bg-white rounded-3xl shadow-2xl ring-1 ring-gray-200/70 overflow-hidden">
      <motion.div
        animate={{ opacity: isFront ? 1 : 0 }}
        transition={{ duration: 0.4, delay: isFront ? 0.2 : 0 }}
        className="relative p-8 md:p-14 flex flex-col gap-6"
        aria-hidden={!isFront}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconClassName ?? "text-xl bg-ceruleanBlue-50 text-ceruleanBlue-500"}`}
              >
                <Icon aria-hidden="true" />
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800">{item.title}</h3>
              {item.badge && (
                <span className="text-xs font-semibold bg-ceruleanBlue-100 text-ceruleanBlue-600 rounded-full px-3 py-1">
                  {item.badge}
                </span>
              )}
            </div>
            {item.text.map((paragraph) => (
              <p key={paragraph} className="text-gray-700">
                {paragraph}
              </p>
            ))}
            {item.afterText}
            {item.links && <div className="flex flex-col items-start gap-1 text-sm">{item.links}</div>}
          </div>
          <div className="self-center">{item.visual}</div>
        </div>
        {item.extra}
      </motion.div>
    </div>
  );
};

const WhatWeSolve = () => {
  // `previous` is the card that was in front before the last change. It gets the "sink and go back" animation.
  const [{ active, previous }, setState] = useState({ active: 0, previous: -1 });
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { amount: 0.3 });
  const reduceMotion = useReducedMotion();

  const count = problems.length;
  const isPaused = isHovered || isFocused || !isInView;

  const goTo = (index: number) => {
    const next = (index + count) % count;
    if (next === active) return;
    setState({ active: next, previous: active });
  };

  return (
    <section className="bg-gray-100 py-16 overflow-hidden" id="what-we-solve" ref={sectionRef}>
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800">What we solve</h2>
          <p className="text-lg md:text-xl text-gray-600 mt-4 max-w-3xl mx-auto">
            Sourcify makes Ethereum verifiable, human-readable, and open-source by default.
          </p>
        </motion.div>

        <div
          onMouseEnter={() => setIsHovered(true)}
          // Also on move: if the page loads under the mouse, no mouseenter event comes
          onMouseMove={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          // Keyboard users also pause it. A mouse click does not, so the rotation goes on after the mouse leaves.
          onFocus={(e) => setIsFocused(e.target.matches(":focus-visible"))}
          onBlur={() => setIsFocused(false)}
        >
          {/* Tabs: one per card, with a timer bar under the active one */}
          <div role="tablist" aria-label="Problems Sourcify solves" className="flex flex-wrap justify-center gap-2 mb-6">
            {problems.map((item, index) => {
              const isActive = index === active;
              return (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`wws-card-${item.id}`}
                  onClick={() => goTo(index)}
                  className={`relative overflow-hidden rounded-full px-4 py-2 text-sm md:text-base font-medium transition-colors ${
                    isActive ? "text-white" : "text-gray-600 hover:text-gray-900 hover:bg-white"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="wws-active-tab"
                      className="absolute inset-0 rounded-full bg-gray-800"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className="relative">{item.title}</span>
                  {isActive && !reduceMotion && (
                    <span
                      key={active}
                      className="absolute bottom-0 left-0 h-[3px] w-full origin-left bg-ceruleanBlue-500"
                      style={{
                        animation: `wws-progress ${ROTATE_MS}ms linear forwards`,
                        animationPlayState: isPaused ? "paused" : "running",
                      }}
                      onAnimationEnd={() => goTo(active + 1)}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* The stack. All cards share one grid cell, so the stack is as tall as the tallest card. */}
          <div className="relative grid" style={{ paddingTop: PEEK_PX * (count - 1) }}>
            {problems.map((item, index) => {
              const position = (index - active + count) % count; // 0 is the front card
              const isFront = position === 0;
              const wasFront = index === previous;
              const y = -position * PEEK_PX;
              const scale = 1 - position * 0.04;
              const opacity = 1 - position * 0.22;
              const rotate = isFront ? 0 : position % 2 ? 1.2 : -1.2;

              return (
                <motion.div
                  key={item.id}
                  id={`wws-card-${item.id}`}
                  role="tabpanel"
                  className="[grid-area:1/1] self-start origin-top"
                  style={{ zIndex: count - position }}
                  initial={false}
                  animate={
                    // The card that leaves the front sinks down, fades, and then settles at its place in the back
                    wasFront && !isFront && !reduceMotion
                      ? {
                          y: [0, 60, y],
                          scale: [1, 0.92, scale],
                          opacity: [1, 0, opacity],
                          rotate: [0, -3, rotate],
                        }
                      : { y, scale, opacity, rotate }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : wasFront && !isFront
                        ? { duration: 0.9, times: [0, 0.45, 1], ease: "easeInOut" }
                        : { type: "spring", stiffness: 160, damping: 24 }
                  }
                  // On touch screens, swipe the front card to change it
                  drag={isFront ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.25}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -80) goTo(active + 1);
                    else if (info.offset.x > 80) goTo(active - 1);
                  }}
                  onClick={() => !isFront && goTo(index)}
                >
                  <div className={isFront ? "" : "cursor-pointer"}>
                    <Card item={item} isFront={isFront} />
                  </div>
                </motion.div>
              );
            })}

            {/* Small hint that the rotation stops while the reader is on the cards */}
            <motion.div
              animate={{ opacity: isHovered && !reduceMotion ? 1 : 0 }}
              className="pointer-events-none absolute right-4 bottom-4 z-50 inline-flex items-center gap-1.5 rounded-full bg-gray-800/80 px-3 py-1 text-xs text-white"
              aria-hidden="true"
            >
              <FaPause /> Paused
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatWeSolve;
