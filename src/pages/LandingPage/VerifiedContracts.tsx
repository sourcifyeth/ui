import { useContext, useEffect, useState, useRef } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import LoadingOverlay from "../../components/LoadingOverlay";
import { Context } from "../../Context";
import ChainSelect from "../../components/ChainSelect";
import { motion, useInView } from "framer-motion";
import Button from "../../components/Button";
import { FaDownload } from "react-icons/fa";
import { FiInfo } from "react-icons/fi";
import { Tooltip as ReactTooltip } from "react-tooltip";

const NUMBER_OF_TOP_CHAINS = 10;

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

function timeAgo(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const Chart = () => {
  const { sourcifyChainMap, sourcifyChains } = useContext(Context);
  const [selectedChain, setSelectedChain] = useState<string>("1");
  const [displayTotal, setDisplayTotal] = useState(0);
  const sectionRef = useRef(null);
  const isSectionInView = useInView(sectionRef, { once: true });
  const [stats, setStats] = useState<statsType | undefined>(undefined);

  const [datasetStats, setDatasetStats] = useState<DatasetStatsType | null>(null);

  // Window width to make the chart responsive. We'll change the font sizes and tick width based on this
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // We are temporarily putting the stats.json file in the static folder on GCP.
    // This assumes that the file is available.
    fetch(`https://${process.env.REACT_APP_TAG === "staging" ? "staging." : ""}sourcify.dev/static/stats.json`)
      .then((res) => res.json())
      .then((json) => setStats(json))
      .catch(() => console.error("error fetching stats"));
  }, []);

  useEffect(() => {
    fetch(`https://export.${process.env.REACT_APP_TAG === "staging" ? "staging." : ""}sourcify.dev/v2/stats.json`)
      .then((res) => res.json())
      .then((json) => setDatasetStats(json))
      .catch(() => console.error("error fetching dataset stats"));
  }, []);

  useEffect(() => {
    if (stats && isSectionInView) {
      const total = Object.values(stats || {}).reduce((prev, curr, i) => {
        return prev + curr.full_match + curr.partial_match;
      }, 0);
      setDisplayTotal(total);

      const duration = 1000; // 1 second animation
      const steps = 60; // Number of steps
      const increment = total / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= total) {
          setDisplayTotal(total);
          clearInterval(timer);
        } else {
          setDisplayTotal(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [stats, isSectionInView]);

  const getFormattedChainData = (key: string) => {
    const keyInt = parseInt(key);
    if (!stats) {
      return {
        name: "",
        fullMatch: 0,
        partialMatch: 0,
        total: 0,
      };
    }
    return {
      name:
        sourcifyChainMap?.[keyInt] &&
        (sourcifyChainMap[keyInt]?.name || sourcifyChainMap[keyInt].title) + ` (${keyInt})`, // Shorter name takes precedence
      fullMatch: stats[key]?.full_match ?? 0,
      partialMatch: stats[key]?.partial_match ?? 0,
      total: (stats[key]?.full_match ?? 0) + (stats[key]?.partial_match ?? 0),
    };
  };

  const formattedData = Object.entries(stats || {})
    .sort(([aKey, aStats], [bKey, bStats]) => {
      return bStats.full_match + bStats.partial_match - (aStats.full_match + aStats.partial_match);
    })
    .slice(0, NUMBER_OF_TOP_CHAINS)
    .map(([key, chainStats]) => getFormattedChainData(key));

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
      ) : !Object.keys(sourcifyChainMap).length ? (
        <div className="h-72 md:h-96 lg:h-[36rem] w-full relative">
          <LoadingOverlay message="Getting Sourcify chains" />
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-8xl font-bold text-ceruleanBlue-500">{displayTotal.toLocaleString()}</h2>
            <h2 className="text-2xl md:text-5xl mt-3 text-ceruleanBlue-500 text-center">contracts verified</h2>
            <a
              href="https://stats.sourcify.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block text-base md:text-lg text-ceruleanBlue-400 hover:text-ceruleanBlue-600 underline underline-offset-4"
            >
              📊 stats.sourcify.dev
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
                <span className="text-xs text-gray-400 mt-0.5">updated {timeAgo(datasetStats.generatedAt)}</span>
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
          <div className="flex flex-col items-center my-8">
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
          <div className="w-full flex flex-col items-center justify-center">
            <div className="my-4 flex md:flex-row flex-col items-center text-gray-700">
              <span className="text-nowrap ml-2">
                {getFormattedChainData(selectedChain).total.toLocaleString()} contracts on
              </span>
              <ChainSelect
                value={selectedChain}
                handleChainIdChange={(newChainId) => setSelectedChain(newChainId.toString())}
                availableChains={sourcifyChains.map((chain) => chain.chainId)}
                className="font-medium"
                transparent
              />
            </div>
            <div className="h-[30rem] w-11/12 max-w-2xl mb-12 text-sm lg:text-base">
              <ResponsiveContainer>
                <BarChart
                  data={formattedData}
                  {...{
                    overflow: "visible",
                  }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip cursor={{ fill: "rgba(232, 239, 255, 0.4)" }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{
                      fontSize: windowWidth < 768 ? 8 : 12,
                      width: windowWidth < 768 ? 100 : 300,
                    }}
                  />
                  <XAxis
                    domain={[
                      0,
                      (dataMax: number) => {
                        const digits = dataMax.toString().length - 1;
                        const roundedMax = Math.ceil(dataMax / 10 ** digits) * 10 ** digits;
                        return roundedMax;
                      },
                    ]}
                    angle={windowWidth < 768 ? 45 : 0}
                    textAnchor={windowWidth < 768 ? "start" : "middle"}
                    dataKey="total"
                    type="number"
                    tickFormatter={(tick) => tick.toLocaleString()}
                    tick={{ fontSize: windowWidth < 768 ? 8 : 12 }}
                  />
                  <Legend verticalAlign="top" align="center" height={36} />
                  <Bar name="Exact Matches" dataKey="fullMatch" fill="#2B50AA" stackId="a" />
                  <Bar name="Matches" dataKey="partialMatch" fill="#7693DA" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default Chart;
