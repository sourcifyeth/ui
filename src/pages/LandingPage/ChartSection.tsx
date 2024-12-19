import { useContext, useEffect, useState, useRef } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import LoadingOverlay from "../../components/LoadingOverlay";
import { REPOSITORY_SERVER_URL } from "../../constants";
import { Context } from "../../Context";
import ChainSelect from "../../components/ChainSelect";
import { motion, useInView } from "framer-motion";

const NUMBER_OF_TOP_CHAINS = 10;

type statsType = {
  [key: string]: {
    full_match: number;
    partial_match: number;
  };
};

const Chart = () => {
  const { sourcifyChainMap, sourcifyChains } = useContext(Context);
  const [selectedChain, setSelectedChain] = useState<string>("1");
  const [displayTotal, setDisplayTotal] = useState(0);
  const sectionRef = useRef(null);
  const isSectionInView = useInView(sectionRef, { once: true });
  const [stats, setStats] = useState<statsType | undefined>(undefined);

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
    fetch(`${REPOSITORY_SERVER_URL}/stats.json`)
      .then((res) => res.json())
      .then((json) => setStats(json))
      .catch(() => console.error("error fetching stats"));
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

  if (!stats) {
    return (
      <div className="h-72 md:h-96 lg:h-[36rem] w-full relative" ref={sectionRef}>
        <LoadingOverlay message="Getting stats" />
      </div>
    );
  }
  if (Object.keys(sourcifyChainMap).length === 0) {
    return (
      <div className="h-72 md:h-96 lg:h-[36rem] w-full relative" ref={sectionRef}>
        <LoadingOverlay message="Getting Sourcify chains" />
      </div>
    );
  }

  const getFormattedChainData = (key: string) => {
    const keyInt = parseInt(key);
    return {
      name:
        sourcifyChainMap?.[keyInt] &&
        (sourcifyChainMap[keyInt]?.name || sourcifyChainMap[keyInt].title) + ` (${keyInt})`, // Shorter name takes precedence
      fullMatch: stats[key]?.full_match ?? 0,
      partialMatch: stats[key]?.partial_match ?? 0,
      total: (stats[key]?.full_match ?? 0) + (stats[key]?.partial_match ?? 0),
    };
  };

  const formattedData = Object.entries(stats)
    .sort(([aKey, aStats], [bKey, bStats]) => {
      return bStats.full_match + bStats.partial_match - (aStats.full_match + aStats.partial_match);
    })
    .slice(0, NUMBER_OF_TOP_CHAINS)
    .map(([key, chainStats]) => getFormattedChainData(key));

  return (
    <div className="w-full flex flex-col items-center justify-center text-center">
      <motion.div
        ref={sectionRef}
        initial={{ opacity: 0, y: 20 }}
        animate={isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-5xl md:text-8xl font-bold text-ceruleanBlue-500">{displayTotal.toLocaleString()}</h2>
        <h2 className="text-2xl md:text-5xl mt-3 text-ceruleanBlue-500 text-center">contracts verified</h2>
      </motion.div>
      <div className="flex flex-col items-center my-8">
        <a
          href="https://docs.sourcify.dev/docs/repository/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg text-ceruleanBlue-500 hover:text-ceruleanBlue-600 link-underline font-medium"
        >
          Download all verified contracts →
        </a>
        <span className="text-sm text-gray-600 mt-1">
          Access the complete repository of source-verified smart contracts
        </span>
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
              <Bar name="Full Matches" dataKey="fullMatch" fill="#2B50AA" stackId="a" />
              <Bar name="Partial Matches" dataKey="partialMatch" fill="#7693DA" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Chart;
