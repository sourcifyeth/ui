import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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

// Fixed list height with a half-cut last row, so a new item never moves the page and the list looks scrollable.
const VISIBLE_ROWS = 6.5;
const ROW_HEIGHT_PX = 52;
const ROW_STEP_PX = ROW_HEIGHT_PX + 1; // divide-y adds a 1px line above every row after the first
const LIST_HEIGHT_PX = Math.round(VISIBLE_ROWS * ROW_STEP_PX - 1) + 2; // first row has no line above; + 2px border
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

// Only this small component re-renders every second, not the whole row.
const RelativeTime = ({ isoDate }: { isoDate: string }) => {
  const now = useNow(1000);
  return <>{formatRelativeTime(isoDate, now)}</>;
};

type FeedRowProps = {
  item: LiveItem;
  chainName: string;
  /** True for an item that arrived after the feed was shown and should animate in. */
  animateIn: boolean;
};

const FeedRow = memo(({ item, chainName, animateIn: animateInProp }: FeedRowProps) => {
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
        // A green line on the left edge marks the new row and then fades out.
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-green-500"
          initial={{ scaleY: 0, opacity: 1 }}
          animate={{ scaleY: 1, opacity: 0 }}
          transition={{ scaleY: { duration: 0.35 }, opacity: { delay: 1.2, duration: 1.5 } }}
        />
      )}
      <a
        href={`${REPOSITORY_URL}/${item.chainId}/${item.address}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center gap-2 px-3 text-sm hover:bg-ceruleanBlue-50"
        style={{ height: ROW_HEIGHT_PX }}
        title={`${item.address} on ${chainName}`}
      >
        {/* The full address fits from the md breakpoint. Smaller screens show the short form. */}
        <motion.span
          className="flex-1 min-w-0 flex flex-col leading-tight"
          initial={animateIn ? { x: -12, opacity: 0 } : false}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.35, ease: "easeOut" }}
        >
          <RowText item={item} chainName={chainName} />
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
            <RelativeTime isoDate={item.verifiedAt} />
          </span>
        </span>
      </a>
    </motion.li>
  );
});
FeedRow.displayName = "FeedRow";

// <code> gets the app's monospace font (index.css). Tailwind's font-mono is not set up in this app.
const Address = ({ address, className }: { address: string; className: string }) => (
  <code className={`truncate text-ceruleanBlue-500 ${className}`}>
    <span className="hidden md:inline">{address}</span>
    <span className="md:hidden">{shortenAddress(address)}</span>
  </code>
);

// Line 1: the address. Line 2: the contract name (if the server sent one) and the chain.
const RowText = ({ item, chainName }: { item: LiveItem; chainName: string }) => (
  <>
    <Address address={item.address} className="text-[13px]" />
    <span className="mt-0.5 truncate text-xs text-gray-500">
      {item.name && <span className="font-medium text-gray-700">{item.name} · </span>}
      {chainName}
    </span>
  </>
);

const rowsOf = (list: HTMLElement) => Array.from(list.querySelectorAll<HTMLElement>("li[data-match-id]"));

const PlaceholderRow = () => (
  <li aria-hidden className="flex items-center gap-3 px-3" style={{ height: ROW_HEIGHT_PX }}>
    <span className="h-2.5 w-24 rounded bg-gray-100" />
    <span className="h-2.5 w-20 rounded bg-gray-100" />
  </li>
);

const LiveFeed = ({ items, isLive, chainMap }: LiveFeedProps) => {
  const reduceMotion = useReducedMotion();
  const listRef = useRef<HTMLUListElement>(null);

  // Items of the first render do not animate. (Read-only during render: React renders twice in dev mode.)
  const [initialIds] = useState(() => new Set(items.map((item) => item.matchId)));

  // Keep the top visible row in place when items change while the visitor has scrolled the list.
  const isScrolledRef = useRef(false);
  const anchorRef = useRef<{ matchId: string; offset: number } | null>(null);
  const prevTopIdRef = useRef<string | undefined>(items[0]?.matchId);

  const saveAnchor = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const top = rowsOf(list).find((row) => row.offsetTop + row.offsetHeight > list.scrollTop);
    anchorRef.current = top ? { matchId: top.dataset.matchId!, offset: top.offsetTop - list.scrollTop } : null;
  }, []);

  useLayoutEffect(() => {
    const list = listRef.current;
    const anchor = anchorRef.current;
    if (list && isScrolledRef.current && anchor) {
      const row = rowsOf(list).find((r) => r.dataset.matchId === anchor.matchId);
      if (row) {
        list.scrollTop = row.offsetTop - anchor.offset;
      } else {
        // The anchor row was dropped (MAX_FEED_ITEMS): move down by the rows that were added on top.
        const addedOnTop = items.findIndex((item) => item.matchId === prevTopIdRef.current);
        if (addedOnTop > 0) list.scrollTop += addedOnTop * ROW_STEP_PX;
      }
    }
    prevTopIdRef.current = items[0]?.matchId;
    saveAnchor();
  }, [items, saveAnchor]);

  const chainName = (chainId: string) => {
    const chain = chainMap[parseInt(chainId)];
    return chain?.name || chain?.title || `Chain ${chainId}`;
  };

  const rows = items.map((item) => (
    <FeedRow
      key={item.matchId}
      item={item}
      chainName={chainName(item.chainId)}
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
        style={{ height: LIST_HEIGHT_PX }}
        className={`relative ${HIDE_SCROLLBAR_CLASS} ${NO_SCROLL_ANCHOR_CLASS} overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white divide-y divide-gray-100`}
        aria-live="off"
      >
        {rows}
        {placeholders}
      </ul>
    </div>
  );
};

export default LiveFeed;
