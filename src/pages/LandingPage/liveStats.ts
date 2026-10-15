// Pure helpers for the live verified-contracts stream (see useLiveStats.ts).
// Kept free of React and browser APIs so they are easy to test.

export type LiveMatch = "exact_match" | "match";

export type LiveItem = {
  matchId: string;
  chainId: string;
  address: string;
  match: LiveMatch;
  verifiedAt: string;
  /** Contract name. Missing for matches from older server log lines. */
  name?: string | null;
};

export type LiveEvent = {
  total: number;
  items: LiveItem[];
};

export const MAX_FEED_ITEMS = 30;

function isLiveItem(value: unknown): value is LiveItem {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.matchId === "string" &&
    typeof v.chainId === "string" &&
    typeof v.address === "string" &&
    (v.match === "exact_match" || v.match === "match") &&
    typeof v.verifiedAt === "string"
  );
}

/**
 * Parses the `data` field of one SSE message.
 * Returns null if the payload is not valid. Invalid items are dropped.
 */
export function parseLiveEvent(data: string): LiveEvent | null {
  let json: unknown;
  try {
    json = JSON.parse(data);
  } catch {
    return null;
  }
  if (!json || typeof json !== "object") return null;
  const { total, items } = json as Record<string, unknown>;
  if (typeof total !== "number" || !Number.isFinite(total) || total < 0) return null;
  return {
    total,
    items: Array.isArray(items)
      ? items.filter(isLiveItem).map((item) => ({
          ...item,
          name: typeof item.name === "string" && item.name !== "" ? item.name : null,
        }))
      : [],
  };
}

/** Compares two numeric id strings without converting to a number. Returns > 0 if a is newer. */
function compareMatchIds(a: string, b: string): number {
  if (a.length !== b.length) return a.length - b.length;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Adds incoming items to the feed: removes duplicates (by matchId),
 * puts the newest first and keeps at most `max` items.
 */
export function mergeLiveItems(current: LiveItem[], incoming: LiveItem[], max = MAX_FEED_ITEMS): LiveItem[] {
  if (incoming.length === 0) return current;
  const byId = new Map<string, LiveItem>();
  for (const item of current) byId.set(item.matchId, item);
  for (const item of incoming) byId.set(item.matchId, item);
  return Array.from(byId.values())
    .sort((a, b) => compareMatchIds(b.matchId, a.matchId))
    .slice(0, max);
}

/** 0x0d89Cb4f4220B7BECB5A54f9e16De41a615987FC -> 0x0d89…87FC */
export function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** "just now", "12s ago", "3m ago", "2h ago", "4d ago" */
export function formatRelativeTime(isoDate: string, now: number): string {
  const time = new Date(isoDate).getTime();
  if (Number.isNaN(time)) return "";
  const seconds = Math.floor((now - time) / 1000);
  if (seconds < 5) return "just now"; // also covers small clock differences (negative values)
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
