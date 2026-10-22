// The numbers that more than one landing page section shows: the verified contract count, the signature count
// and the size of the public database. The provider loads each one once, and it opens one live stream for the
// count, so the hero and the "What we solve" cards do not each send their own requests.
// (The contract stats section keeps its own stream: it opens it only while it is on screen.)
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { IS_STAGING } from "../../constants";
import useLiveStats, { LiveStats } from "./useLiveStats";

// Staging builds, Netlify previews and the dev server read the staging 4byte database, like the other stats
export const FOURBYTE_HOST = IS_STAGING ? "4byte.staging.sourcify.dev" : "4byte.sourcify.dev";
export const FOURBYTE_API = `https://api.${FOURBYTE_HOST}/signature-database/v1`;

type LandingStats = {
  live: LiveStats;
  /** The live total, or the daily stats.json total until the live total arrives */
  contractCount: number | null;
  signatureCount: number | null;
  databaseBytes: number | null;
};

const LandingStatsContext = createContext<LandingStats | null>(null);

export const LandingStatsProvider = ({ children }: { children: ReactNode }) => {
  const live = useLiveStats(true);
  const [signatureCount, setSignatureCount] = useState<number | null>(null);
  const [dailyTotal, setDailyTotal] = useState<number | null>(null);
  const [databaseBytes, setDatabaseBytes] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${FOURBYTE_API}/stats`)
      .then((r) => r.json())
      .then((json) => setSignatureCount(json.result?.count?.total ?? null))
      .catch(() => setSignatureCount(null));
    fetch(`https://${IS_STAGING ? "staging." : ""}sourcify.dev/static/stats.json`)
      .then((r) => r.json())
      .then((stats: Record<string, { full_match: number; partial_match: number }>) =>
        setDailyTotal(Object.values(stats).reduce((sum, s) => sum + s.full_match + s.partial_match, 0)),
      )
      .catch(() => setDailyTotal(null));
    fetch(`https://export.${IS_STAGING ? "staging." : ""}sourcify.dev/v2/stats.json`)
      .then((r) => r.json())
      .then((stats: { database?: { totalBytes?: number } }) => setDatabaseBytes(stats.database?.totalBytes ?? null))
      .catch(() => setDatabaseBytes(null));
  }, []);

  return (
    <LandingStatsContext.Provider value={{ live, contractCount: live.total ?? dailyTotal, signatureCount, databaseBytes }}>
      {children}
    </LandingStatsContext.Provider>
  );
};

export const useLandingStats = (): LandingStats => {
  const stats = useContext(LandingStatsContext);
  if (!stats) throw new Error("useLandingStats must be used inside LandingStatsProvider");
  return stats;
};

// Whole GB below 1 TB, then TB with one decimal (decimal units, the same as the stats section)
export const formatSize = (bytes: number) => (bytes >= 1e12 ? `${(bytes / 1e12).toFixed(1)} TB` : `${Math.round(bytes / 1e9)} GB`);

// Short form for the hero numbers: 56.7M, 950K. It rounds to the nearest value.
export const formatCompact = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n);

// Short form for "more than N" in a sentence. It rounds down, so the sentence stays true: 56.66M -> "56.6M".
export const formatAtLeast = (n: number) =>
  n >= 1e6 ? `${(Math.floor(n / 1e5) / 10).toString()}M` : n >= 1e3 ? `${Math.floor(n / 1e3)}K` : String(n);
