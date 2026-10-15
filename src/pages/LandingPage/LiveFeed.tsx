import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import MatchBadge from "../../components/MatchBadge";
import { REPOSITORY_URL } from "../../constants";
import { ChainMap } from "../../types";
import { LiveItem, formatRelativeTime, shortenAddress } from "./liveStats";

type LiveFeedProps = {
  items: LiveItem[];
  isLive: boolean;
  chainMap: ChainMap;
};

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

const LiveFeed = ({ items, isLive, chainMap }: LiveFeedProps) => {
  const now = useNow(1000);
  const reduceMotion = useReducedMotion();

  const chainName = (chainId: string) => {
    const chain = chainMap[parseInt(chainId)];
    return chain?.name || chain?.title || `Chain ${chainId}`;
  };

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
      <ul className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.matchId}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <a
                href={`${REPOSITORY_URL}/${item.chainId}/${item.address}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-ceruleanBlue-50"
                title={`${item.address} on ${chainName(item.chainId)}`}
              >
                {/* On small screens the chain name and the time go on a second line, so the address is never cut. */}
                <span className="flex-1 min-w-0 flex flex-col sm:flex-row sm:gap-1 text-gray-700">
                  <span className="font-mono text-ceruleanBlue-500 whitespace-nowrap">{shortenAddress(item.address)}</span>
                  <span className="truncate text-xs sm:text-sm text-gray-500 sm:text-gray-700">
                    on {chainName(item.chainId)}
                  </span>
                </span>
                <span className="flex-shrink-0 flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                  <MatchBadge match={item.match} small className="!text-xs !py-0.5" />
                  <span className="sm:w-14 text-right text-xs text-gray-400 tabular-nums whitespace-nowrap">
                    {formatRelativeTime(item.verifiedAt, now)}
                  </span>
                </span>
              </a>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
};

export default LiveFeed;
