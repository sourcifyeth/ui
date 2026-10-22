import { Fragment, ReactNode, useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
  FaFileSignature,
  FaHashtag,
  FaPause,
  FaUserShield,
} from "react-icons/fa";
import { IoCheckmarkDoneCircle } from "react-icons/io5";
import { FiArrowRight } from "react-icons/fi";
import { formatAtLeast, useLandingStats } from "./landingStats";
import { IconType } from "react-icons";
import SourceBytecodeSlider from "./SourceBytecodeSlider";
import ClearSigningExample from "./ClearSigningExample";
import solidityLogo from "../../assets/languages/solidity.svg";
import vyperLogo from "../../assets/languages/vyper.svg";
import feLogo from "../../assets/languages/fe.svg";

// How long each card stays in front before the stack rotates
const ROTATE_MS = 7000;
// The smallest part of the previous and next card that shows at each side, and the space between cards.
// On wide screens the side cards show more, up to the page edge.
const PEEK_PX = { small: 16, large: 56 };
const GAP_PX = { small: 12, large: 24 };
// The active card is never wider than this, about the width of the page content (max-w-6xl)
const MAX_CARD_PX = 1088;

const mod = (n: number, m: number) => ((n % m) + m) % m;

// Every link on the cards: "text →", in one row at the bottom of the text column
const CardLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-ceruleanBlue-500 link-underline"
  >
    {children}
    <FiArrowRight aria-hidden="true" />
  </a>
);

// Dark panel that shows the problem as raw data next to its readable form
const Visual = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div
    className={`w-full bg-[#111827] text-gray-100 rounded-xl p-5 font-mono text-xs shadow-inner ring-1 ring-white/10 ${className}`}
  >
    {children}
  </div>
);

// The live numbers in the card text. Until a number arrives, its words do not show, so the sentence stays complete.
const ContractCountSentence = () => {
  const { contractCount } = useLandingStats();
  if (contractCount === null) return null;
  return (
    <>
      {" "}
      <span className="font-semibold">{formatAtLeast(contractCount)}+</span> contracts verified.
    </>
  );
};

const SignatureCountClause = () => {
  const { signatureCount } = useLandingStats();
  if (signatureCount === null) return null;
  return (
    <>
      , with more than <span className="font-semibold">{formatAtLeast(signatureCount)}</span> signatures
    </>
  );
};

type FooterItem = { name: string; logo: string; url: string };

type Problem = {
  id: string;
  title: string;
  icon: IconType;
  // Size and colors of the icon box. The default is Sourcify blue.
  iconClassName?: string;
  // Two short paragraphs on every card
  text: [ReactNode, ReactNode];
  links: { label: string; href: string }[];
  visual: ReactNode;
  // The footer row of every card: a label, then logos with names, or a status
  footer: { label: string; items?: FooterItem[]; status?: string };
};

const problems: Problem[] = [
  {
    id: "verification",
    title: "Source Code Verification",
    // Same icon and green as the "Exact Match" badge on repo.sourcify.dev
    icon: IoCheckmarkDoneCircle,
    iconClassName: "bg-green-100 text-green-800 border border-green-200 text-2xl",
    text: [
      <>
        Sourcify's main service: we check that the source code of a contract matches its bytecode.
        <ContractCountSentence />
      </>,
      "Sourcify is 100% open source, publishes the whole database daily and shares data with other verifiers.",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/argotorg/sourcify" },
      { label: "Download the dataset", href: "https://docs.sourcify.dev/docs/repository/download-dataset/" },
      { label: "Verifier Alliance", href: "https://verifieralliance.org" },
    ],
    visual: <SourceBytecodeSlider />,
    footer: {
      label: "Languages",
      items: [
        { name: "Solidity", logo: solidityLogo, url: "https://soliditylang.org" },
        { name: "Vyper", logo: vyperLogo, url: "https://vyperlang.org" },
        { name: "Fe", logo: feLogo, url: "https://fe-lang.org" },
      ],
    },
  },
  {
    id: "4byte",
    title: "4byte Database",
    icon: FaHashtag,
    text: [
      <>
        Sourcify runs the largest EVM function/event/error signatures database
        <SignatureCountClause />.
      </>,
      "It combines signatures from verified contracts with imported collections.",
    ],
    links: [{ label: "4byte.sourcify.dev", href: "https://4byte.sourcify.dev" }],
    visual: (
      <Visual>
        {/* Real hashes: the 4-byte selector of a function or error, and the 32-byte topic of an event (shortened) */}
        <div className="grid grid-cols-[auto_auto_1fr] items-baseline gap-x-3 gap-y-4">
          {[
            { kind: "Function", hash: "0xa9059cbb", name: "transfer(address,uint256)" },
            { kind: "Function", hash: "0x095ea7b3", name: "approve(address,uint256)" },
            { kind: "Event", hash: "0xd78ad95f…d822", name: "Swap(address,uint256,uint256,uint256,uint256,address)" },
            { kind: "Error", hash: "0xe450d38c", name: "ERC20InsufficientBalance(address,uint256,uint256)" },
          ].map(({ kind, hash, name }) => (
            <Fragment key={kind}>
              <div>
                <div className="font-sans text-[10px] uppercase tracking-wider text-gray-500">{kind}</div>
                <div className="text-gray-400 whitespace-nowrap">{hash}</div>
              </div>
              <FaArrowRight className="text-ceruleanBlue-300 self-end mb-1" aria-hidden="true" />
              <div className="min-w-0 self-end text-green-300 [overflow-wrap:anywhere]">
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
    footer: {
      label: "Used by",
      items: [
        { name: "Foundry", logo: "/foundry.png", url: "https://getfoundry.sh" },
        { name: "viem", logo: "/users/viem.png", url: "https://viem.sh" },
        { name: "Remix", logo: "/remix.png", url: "https://remix.ethereum.org" },
        { name: "L2BEAT", logo: "/users/l2beat.png", url: "https://l2beat.com" },
        { name: "MetaMask", logo: "/users/metamask.png", url: "https://metamask.io" },
      ],
    },
  },
  {
    id: "clear-signing",
    title: "ERC7730 Clear Signing",
    icon: FaFileSignature,
    text: [
      "Blind signing is Ethereum's biggest UX issue.",
      "We maintain the ERC7730 registry, move the spec forward and build tooling to foster adoption.",
    ],
    links: [
      { label: "Spec", href: "https://eips.ethereum.org/EIPS/eip-7730" },
      { label: "Registry", href: "https://github.com/ethereum/clear-signing-erc7730-registry" },
      { label: "TypeScript SDK", href: "https://github.com/sourcifyeth/clear-signing" },
    ],
    visual: <ClearSigningExample />,
    footer: {
      label: "Used by",
      items: [
        { name: "Ledger", logo: "/users/ledger.png", url: "https://www.ledger.com" },
        { name: "Trezor", logo: "/users/trezor.png", url: "https://trezor.io" },
        { name: "Ambire", logo: "/users/ambire.png", url: "https://www.ambire.com" },
      ],
    },
  },
  {
    id: "onay",
    title: "Onay: 2FA for Signing",
    icon: FaUserShield,
    text: [
      "Your wallet is the only screen between you and a signature. Most people press confirm and hope.",
      "Onay gets the same transaction as your wallet, checks it locally and shows what it does. It holds no keys.",
    ],
    links: [
      { label: "Read more", href: "https://docs.sourcify.dev/blog/onay-local-signing-companion/" },
      { label: "GitHub", href: "https://github.com/sourcifyeth/onay" },
    ],
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
        {/* What Onay checks before you sign */}
        <ul className="mt-4 flex flex-col gap-2 text-sm text-gray-300">
          {["Same transaction as the wallet", "Contract source code is verified", "Transfers 250 USDC to vitalik.eth"].map(
            (check) => (
              <li key={check} className="flex items-center gap-2">
                <FaCheckCircle className="shrink-0 text-green-400" aria-hidden="true" /> {check}
              </li>
            ),
          )}
        </ul>
        <div className="mt-4 rounded border border-green-500/40 bg-green-500/10 py-2 text-center font-semibold text-green-400">
          Safe to sign
        </div>
      </Visual>
    ),
    footer: { label: "Status", status: "New · in development" },
  },
];

// Every card has the same parts in the same places:
// - left: icon and title, two paragraphs, and the links at the bottom of the column
// - right: the visual, centered in a box of the same height on every card
// - bottom: the footer row, a label with logos or a status
const Card = ({ item, isFront }: { item: Problem; isFront: boolean }) => {
  const Icon = item.icon;
  return (
    // Only the active card gets the large shadow. The track would cut a large shadow on the side cards at its edges.
    <div
      className={`relative flex h-full flex-col bg-white rounded-3xl ring-1 ring-gray-200/70 overflow-hidden transition-shadow duration-500 ${
        isFront ? "shadow-2xl" : "shadow-sm"
      }`}
    >
      <div className="grid flex-1 grid-cols-1 gap-8 p-6 md:p-12 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconClassName ?? "text-xl bg-ceruleanBlue-50 text-ceruleanBlue-500"}`}
            >
              <Icon aria-hidden="true" />
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800">{item.title}</h3>
          </div>
          {item.text.map((paragraph, i) => (
            <p key={i} className="text-gray-700">
              {paragraph}
            </p>
          ))}
          <div className="mt-auto flex flex-wrap gap-x-5 gap-y-1 pt-2 text-sm md:text-base">
            {item.links.map((link) => (
              <CardLink key={link.href} href={link.href}>
                {link.label}
              </CardLink>
            ))}
          </div>
        </div>
        <div className="flex min-h-[19rem] items-center lg:h-80 lg:min-h-0">{item.visual}</div>
      </div>
      {/* On phones the label is on its own row and the items are on the row below it; from sm up they share one row */}
      <div className="flex min-h-[3.5rem] flex-col gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-3 text-sm text-gray-700 sm:flex-row sm:items-center sm:gap-6 md:px-12">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 sm:shrink-0">{item.footer.label}</span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-x-6">
          {item.footer.items?.map(({ name, logo, url }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-ceruleanBlue-500"
            >
              {/* Same box for every logo, so they show at the same size */}
              <img src={logo} alt="" className="h-5 w-5 rounded object-contain" />
              {name}
            </a>
          ))}
          {item.footer.status && (
            <span className="rounded-full bg-ceruleanBlue-100 px-3 py-0.5 text-xs font-semibold text-ceruleanBlue-600">
              {item.footer.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const WhatWeSolve = () => {
  // `step` counts every move and never wraps. Each drawn card is keyed by its step, so cards slide and never jump back.
  const [step, setStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const sectionRef = useRef(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const isInView = useInView(sectionRef, { amount: 0.3 });
  const reduceMotion = useReducedMotion();

  const count = problems.length;
  const active = mod(step, count);
  const isPaused = isHovered || isFocused || !isInView;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(([entry]) => setTrackWidth(entry.contentRect.width));
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const isSmall = trackWidth < 640;
  const peek = isSmall ? PEEK_PX.small : PEEK_PX.large;
  const gap = isSmall ? GAP_PX.small : GAP_PX.large;
  const cardWidth = Math.min(Math.max(trackWidth - 2 * (peek + gap), 0), MAX_CARD_PX);
  // Cards drawn on each side of the active one: enough to fill the screen, plus one off screen, so a card can always slide in
  const sideCards = cardWidth > 0 ? Math.ceil((trackWidth - cardWidth) / 2 / (cardWidth + gap)) + 1 : 0;

  // Go to a card by the shortest way, left or right
  const goTo = (index: number) => {
    let delta = mod(index - active, count);
    if (delta > count / 2) delta -= count;
    if (delta !== 0) setStep((s) => s + delta);
  };
  const move = (delta: number) => setStep((s) => s + delta);

  // Until the track width is known, draw only the active card at full width
  const steps =
    trackWidth > 0
      ? Array.from({ length: 2 * sideCards + 1 }, (_, i) => step - sideCards + i)
      : [step];

  return (
    <section className="bg-gray-100 py-12 md:py-20 overflow-hidden" id="what-we-solve" ref={sectionRef}>
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800">What we solve</h2>
        </motion.div>
      </div>

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
        <div
          role="tablist"
          aria-label="Problems Sourcify solves"
          className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-2 mb-6"
        >
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
                    key={step}
                    // Pink, so the timer stands out on the dark active tab (blue was too dark there)
                    className="absolute bottom-0 left-0 h-[3px] w-full origin-left bg-pink-400"
                    style={{
                      animation: `wws-progress ${ROTATE_MS}ms linear forwards`,
                      animationPlayState: isPaused ? "paused" : "running",
                    }}
                    onAnimationEnd={() => move(1)}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/*
          The track uses the full page width. All cards share one grid cell and stretch to it, so every card is
          as tall as the tallest one. It clips only left and right, so the shadows above and below stay.
        */}
        <div ref={trackRef} className="relative grid overflow-x-clip overflow-y-visible py-6 -my-6">
          {steps.map((cardStep) => {
            const position = cardStep - step; // 0 is the active card, -1 the previous one, 1 the next one
            const isFront = position === 0;
            const item = problems[mod(cardStep, count)];

            return (
              <motion.div
                key={cardStep}
                id={isFront ? `wws-card-${item.id}` : undefined}
                role={isFront ? "tabpanel" : undefined}
                aria-hidden={!isFront}
                className="[grid-area:1/1] self-stretch justify-self-center relative"
                style={{ width: trackWidth > 0 ? cardWidth : "100%", zIndex: isFront ? 1 : 0 }}
                initial={false}
                animate={{
                  x: position * (cardWidth + gap),
                  scale: isFront ? 1 : 0.96,
                  opacity: isFront ? 1 : 0.5,
                }}
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 26 }}
                // On touch screens, swipe the active card to change it
                drag={isFront ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) move(1);
                  else if (info.offset.x > 80) move(-1);
                }}
                onClick={() => !isFront && move(position)}
              >
                <div
                  className={`h-full ${isFront ? "" : "cursor-pointer"}`}
                  // Side cards are only for show, so keyboard focus must not go into them.
                  // React 18 does not know the `inert` attribute, so set it on the element.
                  ref={(el) => {
                    el?.toggleAttribute("inert", !isFront);
                  }}
                >
                  <Card item={item} isFront={isFront} />
                </div>
                {isFront && (
                  // Small hint that the rotation stops while the reader is on the cards, at the top center of the card.
                  // Centered with inset-x-0 + mx-auto, not a translate, so it does not clash with motion's transforms.
                  <motion.div
                    animate={{ opacity: isHovered && !reduceMotion ? 1 : 0 }}
                    className="pointer-events-none absolute inset-x-0 top-3 z-10 mx-auto flex w-fit items-center gap-1.5 rounded-full bg-gray-800/80 px-3 py-1 text-xs text-white"
                    aria-hidden="true"
                  >
                    <FaPause /> Paused
                  </motion.div>
                )}
                {/* Arrow buttons on the left and right edge. Every card has them, so they move with it. Only the active card shows them. */}
                {[
                  { delta: -1, label: "Previous card", Icon: FaChevronLeft, edge: "left-0 -translate-x-1/2" },
                  { delta: 1, label: "Next card", Icon: FaChevronRight, edge: "right-0 translate-x-1/2" },
                ].map(({ delta, label, Icon, edge }) => (
                  <motion.button
                    key={label}
                    type="button"
                    aria-label={label}
                    aria-hidden={!isFront}
                    tabIndex={isFront ? 0 : -1}
                    onClick={() => move(delta)}
                    initial={false}
                    animate={{ opacity: isFront ? 1 : 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.3 }}
                    className={`absolute top-1/2 ${edge} -translate-y-1/2 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg ring-1 ring-gray-200 transition-colors hover:text-ceruleanBlue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceruleanBlue-500 ${
                      isFront ? "" : "pointer-events-none"
                    }`}
                  >
                    <Icon aria-hidden="true" />
                  </motion.button>
                ))}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhatWeSolve;
