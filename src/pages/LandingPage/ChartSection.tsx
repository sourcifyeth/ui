import { useContext, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppIconName from "../../components/AppIconName";
import LoadingOverlay from "../../components/LoadingOverlay";
import { REPOSITORY_SERVER_URL } from "../../constants";
import { Context } from "../../Context";
import featured from "../../featured";
import ChainSelect from "../../components/ChainSelect";

const NUMBER_OF_TOP_CHAINS = 10;

type statsType = {
  [key: string]: {
    full_match: number;
    partial_match: number;
  };
};

const Chart = ({ stats }: { stats: statsType | undefined }) => {
  const { sourcifyChainMap, sourcifyChains } = useContext(Context);
  const [selectedChain, setSelectedChain] = useState<string>("1");

  if (!stats) {
    return (
      <div className="h-72 md:h-96 lg:h-[36rem] w-full relative">
        <LoadingOverlay message="Getting stats" />
      </div>
    );
  }
  if (Object.keys(sourcifyChainMap).length === 0) {
    return (
      <div className="h-72 md:h-96 lg:h-[36rem] w-full relative">
        <LoadingOverlay message="Getting Sourcify chains" />
      </div>
    );
  }

  const getFormattedChainData = (key: string) => {
    const keyInt = parseInt(key);
    return {
      name:
        Object.keys(sourcifyChainMap).length > 0 &&
        sourcifyChainMap[keyInt] &&
        (sourcifyChainMap[keyInt]?.name || sourcifyChainMap[keyInt].title), // Shorter name takes precedence
      fullMatch: stats[key]?.full_match ?? 0,
      partialMatch: stats[key]?.partial_match ?? 0,
      total: (stats[key]?.full_match ?? 0) + (stats[key]?.partial_match ?? 0),
    };
  };

  const formattedData = Object.entries(stats)
    .sort(([aKey, aStats], [bKey, bStats]) => {
      // Sort selected chain to start of the list
      if (aKey === selectedChain && bKey !== selectedChain) return -1;
      if (aKey !== selectedChain && bKey === selectedChain) return 1;

      // Sort Ethereum chains to start of the list
      const preferredChains = ["1", "11155111", "17000"];
      const aKeyPreferred = preferredChains.indexOf(aKey);
      const bKeyPreferred = preferredChains.indexOf(bKey);
      if (aKeyPreferred > -1 && bKeyPreferred > -1) {
        return aKeyPreferred - bKeyPreferred;
      }
      if (aKeyPreferred > -1) return -1;
      if (bKeyPreferred > -1) return 1;

      return (
        bStats.full_match +
        bStats.partial_match -
        (aStats.full_match + aStats.partial_match)
      );
    })
    .slice(0, NUMBER_OF_TOP_CHAINS)
    .map(([key, chainStats]) => getFormattedChainData(key));

  const total = Object.values(stats).reduce((prev, curr, i) => {
    return prev + curr.full_match + curr.partial_match;
  }, 0);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <h2 className="text-3xl font-semibold text-ceruleanBlue-500">
        {total.toLocaleString()}
      </h2>
      <h2 className="text-2xl mt-3 font-semibold text-ceruleanBlue-500">
        contracts verified on Sourcify so far!
      </h2>
      <div className="w-full mt-12 mb-8 flex flex-col items-center justify-center">
        <div className="my-4 flex md:flex-row flex-col items-center">
          <span className="text-nowrap md:mr-2">
            {getFormattedChainData(selectedChain).total.toLocaleString()}{" "}
            contracts verified on
          </span>
          <ChainSelect
            value={selectedChain}
            handleChainIdChange={(newChainId) =>
              setSelectedChain(newChainId.toString())
            }
            availableChains={sourcifyChains.map((chain) => chain.chainId)}
          />
        </div>
        <div className="h-72 md:h-96 lg:h-[30rem] w-11/12 max-w-2xl mt-8 mb-12 text-sm lg:text-base">
          <ResponsiveContainer>
            <BarChart
              data={formattedData}
              {...{
                overflow: "visible",
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip cursor={{ fill: "rgba(232, 239, 255, 0.4)" }} />
              <XAxis
                dataKey="name"
                angle={30}
                textAnchor="start"
                interval={0} // Display every label
              />
              <YAxis
                width={40}
                dataKey="total"
                domain={[
                  0,
                  (dataMax: number) => {
                    const digits = dataMax.toString().length - 1;
                    const roundedMax =
                      Math.ceil(dataMax / 10 ** digits) * 10 ** digits;
                    return roundedMax;
                  },
                ]}
                tickFormatter={(tick) => tick.toLocaleString()}
              />
              <Legend verticalAlign="top" align="center" height={36} />
              <Bar
                name="Full Matches"
                dataKey="fullMatch"
                fill="#2B50AA"
                stackId="a"
              />
              <Bar
                name="Partial Matches"
                dataKey="partialMatch"
                fill="#7693DA"
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

/////////////////////////////
////// MAIN COMPONENT ///////
/////////////////////////////

const Featured = () => {
  return featured.map((project) => {
    if (project.displayed) {
      return (
        <AppIconName
          img={project.logo}
          name={project.name}
          href={project.href}
          key={`app-icon-${project.name}`}
        />
      );
    }

    return null;
  });
};

const ChartSection = () => {
  const [stats, setStats] = useState<statsType>();
  useEffect(() => {
    fetch(`${REPOSITORY_SERVER_URL}/stats.json`)
      .then((res) => res.json())
      .then((json) => setStats(json))
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      <Chart stats={stats} />
      {/* Verified contract examples */}
      <div className="mt-12">
        <h2 className="my-4 text-2xl font-bold text-lightCoral-500 text-center">
          Including:
        </h2>
        <div className="flex flex-row mt-8 flex-wrap items-center justify-center logos-container">
          {Featured()}
        </div>
      </div>
    </div>
  );
};

export default ChartSection;
