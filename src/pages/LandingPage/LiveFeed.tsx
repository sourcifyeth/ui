import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import MatchBadge from "../../components/MatchBadge";
import { REPOSITORY_URL } from "../../constants";
import { ChainMap } from "../../types";
import { LiveItem, formatRelativeTime, shortenAddress } from "./liveStats";

type LiveFeedProps = {
  items: LiveItem[];
  isLive: boolean;
  chainMap: ChainMap;
};

// The list always shows 8 full rows and half of the 9th row. A new item never moves the rest of the page,
// and the cut row shows that the list scrolls.
const VISIBLE_ROWS = 8.5;

// Every row has the same height. Small screens use two lines per row.
const ROW_HEIGHT_CLASS = "h-14 sm:h-11";
const LIST_HEIGHT_CLASS = "h-[478px] sm:h-[376px]"; // VISIBLE_ROWS x row height (56px / 44px) + 2px border
// Scrolls with the wheel, touch and keyboard, but shows no scroll bar.
const HIDE_SCROLLBAR_CLASS = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
// The browser must not move the scroll position by itself when a row grows. LiveFeed does that (see useLayoutEffect).
const NO_SCROLL_ANCHOR_CLASS = "[overflow-anchor:none]";

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

type FeedRowProps = {
  item: LiveItem;
  chainName: string;
  now: number;
  /** True for an item that arrived after the feed was shown and should animate in. */
  animateIn: boolean;
};

const FeedRow = ({ item, chainName, now, animateIn: animateInProp }: FeedRowProps) => {
  // Only the value at mount counts. A later change must not start the animation for a row that is already shown.
  const [animateIn] = useState(animateInProp);
  return (
    <motion.li
      data-match-id={item.matchId}
      className="relative overflow-hidden"
      // A new row grows from zero height, so the rows below slide down inside the fixed-height list.
      initial={animateIn ? { height: 0, opacity: 0 } : false}
      animate={{ height: "auto", opacity: 1 }}
      transition={{ height: { type: "spring", stiffness: 260, damping: 30 }, opacity: { duration: 0.25 } }}
    >
      {animateIn && (
        // A short blue glow that fades out marks the new row.
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ceruleanBlue-200/70 via-ceruleanBlue-100/60 to-transparent"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 0.8, duration: 2.2, ease: "easeOut" }}
        />
      )}
      {animateIn && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-ceruleanBlue-500"
          initial={{ scaleY: 0, opacity: 1 }}
          animate={{ scaleY: 1, opacity: 0 }}
          transition={{ scaleY: { duration: 0.35 }, opacity: { delay: 1.2, duration: 1.5 } }}
        />
      )}
      <a
        href={`${REPOSITORY_URL}/${item.chainId}/${item.address}/`}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative flex items-center gap-2 px-3 text-sm hover:bg-ceruleanBlue-50 ${ROW_HEIGHT_CLASS}`}
        title={`${item.address} on ${chainName}`}
      >
        {/* On small screens the chain name goes on a second line, so the address is never cut. */}
        <motion.span
          className="flex-1 min-w-0 flex flex-col sm:flex-row sm:gap-1 text-gray-700"
          initial={animateIn ? { x: -12, opacity: 0 } : false}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.35, ease: "easeOut" }}
        >
          <span className="font-mono text-ceruleanBlue-500 whitespace-nowrap">{shortenAddress(item.address)}</span>
          <span className="truncate text-xs sm:text-sm text-gray-500 sm:text-gray-700">on {chainName}</span>
        </motion.span>
        <span className="flex-shrink-0 flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2">
          <motion.span
            initial={animateIn ? { scale: 0.6, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 500, damping: 18 }}
          >
            <MatchBadge match={item.match} small showTooltip={false} className="!text-xs !py-0.5" />
          </motion.span>
          <span className="sm:w-14 text-right text-xs text-gray-400 tabular-nums whitespace-nowrap">
            {formatRelativeTime(item.verifiedAt, now)}
          </span>
        </span>
      </a>
    </motion.li>
  );
};

const PlaceholderRow = () => (
  <li aria-hidden className={`flex items-center gap-3 px-3 ${ROW_HEIGHT_CLASS}`}>
    <span className="h-2.5 w-24 rounded bg-gray-100" />
    <span className="h-2.5 w-20 rounded bg-gray-100" />
  </li>
);

const LiveFeed = ({ items, isLive, chainMap }: LiveFeedProps) => {
  const now = useNow(1000);
  const reduceMotion = useReducedMotion();
  const listRef = useRef<HTMLUListElement>(null);

  // Items shown in the first render do not animate. Later items do.
  // (The render must not change this set: React renders twice in development mode.)
  const [initialIds] = useState(() => new Set(items.map((item) => item.matchId)));

  // If the visitor has scrolled down in the list, a new item must not move the rows that they look at.
  // So we remember the top visible row and its offset, and put that row back at the same place after an update.
  const isScrolledRef = useRef(false);
  const anchorRef = useRef<{ matchId: string; offset: number } | null>(null);

  const saveAnchor = () => {
    const list = listRef.current;
    if (!list) return;
    const top = Array.from(list.querySelectorAll<HTMLElement>("li[data-match-id]")).find(
      (row) => row.offsetTop + row.offsetHeight > list.scrollTop,
    );
    anchorRef.current = top ? { matchId: top.dataset.matchId!, offset: top.offsetTop - list.scrollTop } : null;
  };

  useLayoutEffect(() => {
    const list = listRef.current;
    const anchor = anchorRef.current;
    if (list && isScrolledRef.current && anchor) {
      const row = list.querySelector<HTMLElement>(`li[data-match-id="${anchor.matchId}"]`);
      if (row) list.scrollTop = row.offsetTop - anchor.offset;
    }
    saveAnchor();
  }, [items]);

  const chainName = (chainId: string) => {
    const chain = chainMap[parseInt(chainId)];
    return chain?.name || chain?.title || `Chain ${chainId}`;
  };

  const rows = items.map((item) => (
    <FeedRow
      key={item.matchId}
      item={item}
      chainName={chainName(item.chainId)}
      now={now}
      animateIn={!initialIds.has(item.matchId) && !reduceMotion && !isScrolledRef.current}
    />
  ));
  const placeholders = Array.from({ length: Math.max(0, Math.ceil(VISIBLE_ROWS) - items.length) }, (_, i) => (
    <PlaceholderRow key={`placeholder-${i}`} />
  ));

  return (
    <div className="mt-6 w-full max-w-2xl mx-auto px-2 text-left">
      <div className="flex items-center justify-between px-1 mb-2 text-xs md:text-sm text-gray-500">
        <span>Just verified</span>
        {isLive && (
          <span className="flex items-center gap-1.5 font-medium text-green-700" aria-label="Live updates">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Live
          </span>
        )}
      </div>
      <ul
        ref={listRef}
        onScroll={(event) => {
          isScrolledRef.current = event.currentTarget.scrollTop > 0;
          saveAnchor();
        }}
        className={`relative ${LIST_HEIGHT_CLASS} ${HIDE_SCROLLBAR_CLASS} ${NO_SCROLL_ANCHOR_CLASS} overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white divide-y divide-gray-100`}
        aria-live="off"
      >
        {rows}
        {placeholders}
      </ul>
    </div>
  );
};

export default LiveFeed;
