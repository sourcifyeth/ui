import { useEffect, useRef, useState } from "react";
import { LIVE_STATS_URL } from "../../constants";
import { LiveItem, mergeLiveItems, parseLiveEvent } from "./liveStats";

// If the stream sends nothing within this time after the first connect, the caller shows the fallback total.
const FIRST_EVENT_TIMEOUT_MS = 5000;

export type LiveStats = {
  /** Latest live total, or null if no live event has arrived yet. */
  total: number | null;
  /** Newest first, at most MAX_FEED_ITEMS. */
  items: LiveItem[];
  /** True while the stream is open and has delivered at least one event. */
  isLive: boolean;
  /** True if the stream failed or timed out before the first event. Stays false once live data has arrived. */
  useFallback: boolean;
};

function useIsPageVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === "undefined" || document.visibilityState !== "hidden");
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return visible;
}

/**
 * Subscribes to the live verified-contracts stream (Server-Sent Events) while `enabled` is true
 * and the browser tab is visible. Closes the connection otherwise and reconnects when both are true again.
 */
export default function useLiveStats(enabled: boolean): LiveStats {
  const isPageVisible = useIsPageVisible();
  const [total, setTotal] = useState<number | null>(null);
  const [items, setItems] = useState<LiveItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const hasReceivedRef = useRef(false);

  const shouldConnect = enabled && isPageVisible;

  useEffect(() => {
    if (!shouldConnect || typeof EventSource === "undefined") {
      if (typeof EventSource === "undefined") setUseFallback(true);
      return;
    }

    let source: EventSource;
    try {
      source = new EventSource(LIVE_STATS_URL);
    } catch {
      setUseFallback(true);
      return;
    }

    // Until the first event arrives, fall back after a timeout. After that, reconnects keep the values that we already have.
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (!hasReceivedRef.current) {
      timeout = setTimeout(() => {
        if (!hasReceivedRef.current) setUseFallback(true);
      }, FIRST_EVENT_TIMEOUT_MS);
    }

    source.onmessage = (event: MessageEvent<string>) => {
      const parsed = parseLiveEvent(event.data);
      if (!parsed) return;
      hasReceivedRef.current = true;
      setUseFallback(false);
      setIsConnected(true);
      setTotal(parsed.total);
      setItems((prev) => mergeLiveItems(prev, parsed.items));
    };

    // EventSource reconnects by itself after most errors; we only update the UI state here.
    source.onerror = () => {
      setIsConnected(false);
      if (!hasReceivedRef.current) setUseFallback(true);
    };

    return () => {
      if (timeout) clearTimeout(timeout);
      source.close();
      setIsConnected(false);
    };
  }, [shouldConnect]);

  return {
    total,
    items,
    isLive: isConnected && total !== null,
    useFallback: useFallback && total === null,
  };
}
