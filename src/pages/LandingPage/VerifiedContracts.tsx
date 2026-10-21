import { useContext, useEffect, useState, useRef } from "react";
import LoadingOverlay from "../../components/LoadingOverlay";
import { Context } from "../../Context";
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from "framer-motion";
import Button from "../../components/Button";
import { FaDownload } from "react-icons/fa";
import { FiBarChart2, FiInfo } from "react-icons/fi";
import { Tooltip as ReactTooltip } from "react-tooltip";
import useLiveStats from "./useLiveStats";
import LiveFeed from "./LiveFeed";
import RollingNumber from "./RollingNumber";
import { formatRelativeTime } from "./liveStats";
import { IS_STAGING } from "../../constants";

// The live total usually arrives within a few hundred ms. Waiting avoids a count-up to the stats.json total and then a jump.
const LIVE_TOTAL_WAIT_MS = 1000;

type statsType = {
  [key: string]: {
    full_match: number;
    partial_match: number;
  };
};

type TableParquetStats = { bytes: number; fileCount: number };
type TableDbStats = { bytes: number };
type DatasetStatsType = {
  generatedAt: string;
  schemaVersion: string;
  parquet: {
    totalBytes: number;
    fileCount: number;
    tables: Record<string, TableParquetStats>;
  };
  database: {
    totalBytes: number;
    tables: Record<string, TableDbStats>;
  };
};

function formatBytes(bytes: number): string {
  if (bytes >= 1e12) return (bytes / 1e12).toFixed(1) + " TB";
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + " GB";
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + " MB";
  return (bytes / 1e3).toFixed(1) + " KB";
}

/**
 * The shown number for `target`. The first value counts up from 0 (as before). Later values (live updates)
 * are set at once; the caller rolls the changed digits. `hasCounted` is true once the count-up is done.
 */
function useCountUp(target: number | null, reduceMotion: boolean): { value: number; hasCounted: boolean } {
  const [display, setDisplay] = useState(0);
  const [hasCounted, setHasCounted] = useState(false);
  const displayRef = useRef(0);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (target === null) return;
    const set = (value: number) => {
      displayRef.current = value;
      setDisplay(value);
    };
    if (reduceMotion || hasStartedRef.current) {
      // A value that arrives during the count-up also lands here: it stops the count-up and shows the value
      set(target);
      hasStartedRef.current = true;
      setHasCounted(true);
      return;
    }
    hasStartedRef.current = true;
    const controls = animate(displayRef.current, target, {
      duration: 1,
      ease: "linear",
      onUpdate: (value) => set(Math.round(value)),
      onComplete: () => setHasCounted(true),
    });
    return () => controls.stop();
  }, [target, reduceMotion]);

  return { value: display, hasCounted };
}

// How long "+N" stays after the last increase. Increases inside this time add up into one label.
const INCREASE_LABEL_MS = 1800;

/**
 * "+N" for increases of the live total. The first live total only sets the base (it can differ a lot
 * from the daily total shown before it), so only later live events count.
 */
function useLiveIncrease(liveTotal: number | null): { amount: number; key: number } | null {
  const previousRef = useRef<number | null>(null);
  const [label, setLabel] = useState<{ amount: number; key: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (liveTotal === null) return;
    const previous = previousRef.current;
    previousRef.current = liveTotal;
    if (previous === null || liveTotal <= previous) return;
    const delta = liveTotal - previous;
    // Each new label gets a new key, so it fades in again; increases that come close together add up
    setLabel((current) => ({ amount: (current?.amount ?? 0) + delta, key: current?.key ?? Date.now() }));
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setLabel(null), INCREASE_LABEL_MS);
  }, [liveTotal]);

  useEffect(() => () => clearTimeout(timerRef.current), []);
  return label;
}

const Chart = () => {
  const { sourcifyChainMap } = useContext(Context);
  const sectionRef = useRef(null);
  const isSectionInView = useInView(sectionRef, { once: true });
  // Separate from the one above: the live stream is only open while the section is on screen.
  const isSectionOnScreen = useInView(sectionRef);
  const reduceMotion = !!useReducedMotion();
  const [stats, setStats] = useState<statsType | undefined>(undefined);
  const live = useLiveStats(isSectionOnScreen);

  const [datasetStats, setDatasetStats] = useState<DatasetStatsType | null>(null);

  useEffect(() => {
    // We are temporarily putting the stats.json file in the static folder on GCP.
    // This assumes that the file is available.
    fetch(`https://${IS_STAGING ? "staging." : ""}sourcify.dev/static/stats.json`)
      .then((res) => res.json())
      .then((json) => setStats(json))
      .catch(() => console.error("error fetching stats"));
  }, []);

  useEffect(() => {
    fetch(`https://export.${IS_STAGING ? "staging." : ""}sourcify.dev/v2/stats.json`)
      .then((res) => res.json())
      .then((json) => setDatasetStats(json))
      .catch(() => console.error("error fetching dataset stats"));
  }, []);

  // Wait briefly for the live total, then show the daily stats.json total until the live one arrives.
  const [isFallbackReady, setIsFallbackReady] = useState(false);
  useEffect(() => {
    if (!isSectionInView) return;
    const timer = setTimeout(() => setIsFallbackReady(true), LIVE_TOTAL_WAIT_MS);
    return () => clearTimeout(timer);
  }, [isSectionInView]);
  const fallbackTotal = stats
    ? Object.values(stats).reduce((prev, curr) => prev + curr.full_match + curr.partial_match, 0)
    : null;
  const targetTotal = live.total ?? (isFallbackReady ? fallbackTotal : null);
  const displayTotal = useCountUp(isSectionInView ? targetTotal : null, reduceMotion);
  const increase = useLiveIncrease(live.total);

  return (
    <section
      className="w-full flex flex-col items-center justify-center text-center"
      id="verified-contracts"
      ref={sectionRef}
    >
      {/* We need to conditionally render here instead of an if {} above, because the sectionRef needs to be stablely rendered to be used in the useInView hook */}
      {!stats ? (
        <div className="h-72 md:h-96 lg:h-[36rem] w-full relative">
          <LoadingOverlay message="Getting stats" />
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            <h2 className="relative inline-block text-5xl md:text-8xl font-bold leading-none text-ceruleanBlue-500 tabular-nums">
              <RollingNumber value={displayTotal.value} roll={displayTotal.hasCounted && !reduceMotion} />
              {/* "+N" next to the number for live increases. It does not take space, so the number stays centered. */}
              <AnimatePresence>
                {increase && !reduceMotion && (
                  <motion.span
                    key={increase.key}
                    data-testid="live-increase"
                    className="absolute left-full top-0 ml-2 whitespace-nowrap text-lg font-semibold text-emerald-600/80 md:ml-4 md:text-3xl"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    aria-hidden="true"
                  >
                    +{increase.amount.toLocaleString()}
                  </motion.span>
                )}
              </AnimatePresence>
            </h2>
            <h2 className="text-2xl md:text-5xl mt-3 text-ceruleanBlue-500 text-center">contracts verified</h2>
            <a
              href="https://stats.sourcify.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-base font-medium text-ceruleanBlue-500 hover:text-ceruleanBlue-600 link-underline"
            >
              <FiBarChart2 aria-hidden="true" />
              stats.sourcify.dev
            </a>
            {live.total !== null && live.items.length > 0 && (
              <LiveFeed items={live.items} isLive={live.isLive} chainMap={sourcifyChainMap} />
            )}
          </motion.div>

          {datasetStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-8 mt-8 justify-center"
            >
              {/* Parquet export size */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <span className="text-3xl md:text-4xl font-bold text-ceruleanBlue-500">
                    {formatBytes(datasetStats.parquet.totalBytes)}
                  </span>
                  <FiInfo
                    className="text-ceruleanBlue-300 hover:text-ceruleanBlue-500 cursor-pointer text-lg"
                    data-tooltip-id="parquet-size-tooltip"
                  />
                </div>
                <span className="text-sm md:text-base text-gray-600 mt-1">parquet export size</span>
                <span className="text-xs text-gray-400 mt-0.5">updated {formatRelativeTime(datasetStats.generatedAt, Date.now())}</span>
              </div>

              {/* Database size */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <span className="text-3xl md:text-4xl font-bold text-ceruleanBlue-500">
                    {formatBytes(datasetStats.database.totalBytes)}
                  </span>
                  <FiInfo
                    className="text-ceruleanBlue-300 hover:text-ceruleanBlue-500 cursor-pointer text-lg"
                    data-tooltip-id="db-size-tooltip"
                  />
                </div>
                <span className="text-sm md:text-base text-gray-600 mt-1">database size</span>
              </div>

              <ReactTooltip
                id="parquet-size-tooltip"
                clickable
                className="max-w-xs z-50"
                render={() => (
                  <div className="text-sm">
                    <p className="mb-2">
                      We export our complete Postgres database daily into Apache Parquet format.
                      Sizes shown are with parquet (zstd) compression.
                    </p>
                    <a
                      href="https://docs.sourcify.dev/docs/repository/download-dataset/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ceruleanBlue-300 underline"
                    >
                      Learn more →
                    </a>
                    <table className="mt-3 w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="text-left pr-3 pb-1">Table</th>
                          <th className="text-right pr-3 pb-1">Size</th>
                          <th className="text-right pb-1">Files</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(datasetStats.parquet.tables).map(([table, data]) => (
                          <tr key={table} className="border-b border-gray-700">
                            <td className="pr-3 py-0.5 font-mono">{table}</td>
                            <td className="text-right pr-3 py-0.5">{formatBytes(data.bytes)}</td>
                            <td className="text-right py-0.5">{data.fileCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              />

              <ReactTooltip
                id="db-size-tooltip"
                clickable
                className="max-w-xs z-50"
                render={() => (
                  <div className="text-sm">
                    <p className="mb-3">
                      Live sizes of the Sourcify Postgres database on Google Cloud. Includes indexes and TOAST.
                      The total also includes system catalogs, so it is slightly larger than the sum of the tables below.
                    </p>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="text-left pr-3 pb-1">Table</th>
                          <th className="text-right pb-1">Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(datasetStats.database.tables).map(([table, data]) => (
                          <tr key={table} className="border-b border-gray-700">
                            <td className="pr-3 py-0.5 font-mono">{table}</td>
                            <td className="text-right py-0.5">{formatBytes(data.bytes)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              />
            </motion.div>
          )}
          <div className="flex flex-col items-center mt-8">
            <Button href="https://docs.sourcify.dev/docs/repository/" external>
              <FaDownload aria-hidden="true" />
              Download all verified contracts
            </Button>
          </div>
        </>
      )}
    </section>
  );
};

export default Chart;
