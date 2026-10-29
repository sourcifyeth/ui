// Run with: npm test
import { describe, expect, it } from "vitest";
import { LiveItem, formatRelativeTime, mergeLiveItems, parseLiveEvent, shortenAddress } from "./liveStats";

const item = (matchId: string, overrides: Partial<LiveItem> = {}): LiveItem => ({
  matchId,
  chainId: "8453",
  address: "0x0d89Cb4f4220B7BECB5A54f9e16De41a615987FC",
  match: "exact_match",
  verifiedAt: "2026-10-15T09:57:56.579Z",
  name: null,
  ...overrides,
});

describe("parseLiveEvent", () => {
  it("parses a valid message", () => {
    const data = JSON.stringify({ total: 56150969, items: [item("56150969")] });
    expect(parseLiveEvent(data)).toEqual({ total: 56150969, items: [item("56150969")] });
  });

  it("accepts a message without items", () => {
    expect(parseLiveEvent('{"total":5}')).toEqual({ total: 5, items: [] });
  });

  it("drops invalid items", () => {
    const data = JSON.stringify({ total: 1, items: [item("1"), { matchId: 2 }, item("3", { match: "perfect" as any })] });
    expect(parseLiveEvent(data)?.items).toEqual([item("1")]);
  });

  it("returns null for bad payloads", () => {
    expect(parseLiveEvent("not json")).toBeNull();
    expect(parseLiveEvent("null")).toBeNull();
    expect(parseLiveEvent('{"total":"5"}')).toBeNull();
    expect(parseLiveEvent('{"items":[]}')).toBeNull();
  });
});

describe("parseLiveEvent name", () => {
  const base = { matchId: "1", chainId: "1", address: "0x1", match: "match", verifiedAt: "2026-10-15T09:57:56Z" };
  const parseName = (name: unknown) =>
    parseLiveEvent(JSON.stringify({ total: 1, items: [{ ...base, name }] }))?.items[0].name;

  it("keeps a contract name", () => {
    expect(parseName("MyToken")).toBe("MyToken");
  });

  it("uses null for a missing or invalid name", () => {
    expect(parseLiveEvent(JSON.stringify({ total: 1, items: [base] }))?.items[0].name).toBeNull();
    expect(parseName(null)).toBeNull();
    expect(parseName("")).toBeNull();
    expect(parseName(42)).toBeNull();
  });
});

describe("mergeLiveItems", () => {
  it("puts newest first, removes duplicates and keeps at most max items", () => {
    const current = [item("5"), item("4"), item("3"), item("2"), item("1")];
    const merged = mergeLiveItems(current, [item("6"), item("5")], 5);
    expect(merged.map((i) => i.matchId)).toEqual(["6", "5", "4", "3", "2"]);
  });

  it("orders ids numerically, not as text", () => {
    const merged = mergeLiveItems([item("99")], [item("100")]);
    expect(merged.map((i) => i.matchId)).toEqual(["100", "99"]);
  });

  it("returns the same array when nothing is new", () => {
    const current = [item("1")];
    expect(mergeLiveItems(current, [])).toBe(current);
  });

  it("returns the same array when all incoming items are already shown", () => {
    const current = [item("2"), item("1")];
    expect(mergeLiveItems(current, [item("2"), item("1")])).toBe(current);
  });
});

describe("shortenAddress", () => {
  it("keeps the start and the end", () => {
    expect(shortenAddress("0x0d89Cb4f4220B7BECB5A54f9e16De41a615987FC")).toBe("0x0d89…87FC");
  });
});

describe("formatRelativeTime", () => {
  const base = Date.parse("2026-10-15T10:00:00.000Z");
  const ago = (ms: number) => new Date(base - ms).toISOString();

  it("formats the age", () => {
    expect(formatRelativeTime(ago(2000), base)).toBe("just now");
    expect(formatRelativeTime(ago(-3000), base)).toBe("just now");
    expect(formatRelativeTime(ago(12000), base)).toBe("12s ago");
    expect(formatRelativeTime(ago(3 * 60000), base)).toBe("3m ago");
    expect(formatRelativeTime(ago(2 * 3600000), base)).toBe("2h ago");
    expect(formatRelativeTime(ago(4 * 86400000), base)).toBe("4d ago");
  });
});
