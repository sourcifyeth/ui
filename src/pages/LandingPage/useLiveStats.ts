import { useEffect, useRef, useState } from "react";
import { LIVE_STATS_URL } from "../../constants";
import { LiveItem, mergeLiveItems, parseLiveEvent } from "./liveStats";

export type LiveStats = {
  /** Latest live total, or null if no live event has arrived yet. */
  total: number | null;
  /** Newest first, at most MAX_FEED_ITEMS. */
  items: LiveItem[];
  /** True while the stream is open and has delivered at least one event. */
  isLive: boolean;
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
  const hasReceivedRef = useRef(false);

  const shouldConnect = enabled && isPageVisible;

  useEffect(() => {
    if (!shouldConnect || typeof EventSource === "undefined") return;

    let source: EventSource;
    try {
      source = new EventSource(LIVE_STATS_URL);
    } catch {
      return;
    }

    // After a reconnect the server may send nothing until the next match, so the open stream alone counts as live.
    source.onopen = () => {
      if (hasReceivedRef.current) setIsConnected(true);
    };

    source.onmessage = (event: MessageEvent<string>) => {
      const parsed = parseLiveEvent(event.data);
      if (!parsed) return;
      hasReceivedRef.current = true;
      setIsConnected(true);
      setTotal(parsed.total);
      setItems((prev) => mergeLiveItems(prev, parsed.items));
    };

    // EventSource reconnects by itself after most errors; we only update the UI state here.
    source.onerror = () => setIsConnected(false);

    return () => {
      source.close();
      setIsConnected(false);
    };
  }, [shouldConnect]);

  return {
    total,
    items,
    isLive: isConnected && total !== null,
  };
}
