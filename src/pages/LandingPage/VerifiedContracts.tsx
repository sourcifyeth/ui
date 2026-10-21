import { useContext, useEffect, useState, useRef } from "react";
import LoadingOverlay from "../../components/LoadingOverlay";
import { Context } from "../../Context";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import Button from "../../components/Button";
import { FaDownload } from "react-icons/fa";
import { FiBarChart2, FiInfo } from "react-icons/fi";
import { Tooltip as ReactTooltip } from "react-tooltip";
import useLiveStats from "./useLiveStats";
import LiveFeed from "./LiveFeed";
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
 * Animates the shown number towards `target`. The first value counts up from 0 (as before);
 * later values (live updates) use a short tween from the current shown value.
 */
function useAnimatedNumber(target: number | null, reduceMotion: boolean): number {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (target === null) return;
    const set = (value: number) => {
      displayRef.current = value;
      setDisplay(value);
    };
    if (reduceMotion) {
      set(target);
      hasAnimatedRef.current = true;
      return;
    }
    const isFirst = !hasAnimatedRef.current;
    hasAnimatedRef.current = true;
    const controls = animate(displayRef.current, target, {
      duration: isFirst ? 1 : 0.6,
      ease: isFirst ? "linear" : "easeOut",
      onUpdate: (value) => set(Math.round(value)),
    });
    return () => controls.stop();
  }, [target, reduceMotion]);

  return display;
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
  const displayTotal = useAnimatedNumber(isSectionInView ? targetTotal : null, reduceMotion);

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
            <h2 className="text-5xl md:text-8xl font-bold text-ceruleanBlue-500 tabular-nums">{displayTotal.toLocaleString()}</h2>
            <h2 className="text-2xl md:text-5xl mt-3 text-ceruleanBlue-500 text-center">contracts verified</h2>
            {live.total !== null && live.items.length > 0 && (
              <LiveFeed items={live.items} isLive={live.isLive} chainMap={sourcifyChainMap} />
            )}
            <a
              href="https://stats.sourcify.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-base md:text-lg text-ceruleanBlue-400 hover:text-ceruleanBlue-600 underline underline-offset-4"
            >
              <FiBarChart2 aria-hidden="true" />
              stats.sourcify.dev
            </a>
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
            <Button type="">
              <a
                href="https://docs.sourcify.dev/docs/repository/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center text-center gap-1 px-2 md:px-4"
              >
                <div className="flex items-center gap-2">
                  <FaDownload className="text-lg" />
                  <span className="text-base md:text-xl font-semibold">Download</span>
                </div>
                <span className="text-xs md:text-sm">all verified contracts</span>
              </a>
            </Button>
          </div>
        </>
      )}
    </section>
  );
};

export default Chart;
