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

const NUMBER_OF_TOP_CHAINS = 10;

type statsType = {
  [key: string]: {
    full_match: number;
    partial_match: number;
  };
};

const Chart = ({ stats }: { stats: statsType | undefined }) => {
  const { sourcifyChainMap } = useContext(Context);

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

  const formattedData = Object.entries(stats)
    .sort(([aKey, aStats], [bKey, bStats]) => {
      // Sort Ethereum to start of the list
      if (aKey === "1" && bKey !== "1") return -1;
      if (aKey !== "1" && bKey === "1") return 1;
      return (
        bStats.full_match +
        bStats.partial_match -
        (aStats.full_match + aStats.partial_match)
      );
    })
    .slice(0, NUMBER_OF_TOP_CHAINS)
    .map(([key, chainStats]) => {
      const keyInt = parseInt(key);
      return {
        name:
          Object.keys(sourcifyChainMap).length > 0 &&
          sourcifyChainMap[keyInt] &&
          (sourcifyChainMap[keyInt]?.name || sourcifyChainMap[keyInt].title), // Shorter name takes precedence
        fullMatch: stats[key].full_match,
        partialMatch: stats[key].partial_match,
        total: stats[key].full_match + stats[key].partial_match,
      };
    });

  const total = Object.values(stats).reduce((prev, curr, i) => {
    return prev + curr.full_match + curr.partial_match;
  }, 0);

  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="my-4 text-2xl font-bold text-ceruleanBlue-500">
        {" "}
        <span className="text-lightCoral-500">
          {total.toLocaleString()}
        </span>{" "}
        contracts verified on Sourcify so far!
      </h2>
      <div className="h-72 md:h-96 lg:h-[30rem] w-11/12 max-w-2xl my-8">
        <ResponsiveContainer>
          <BarChart
            // width={700}
            // height={300}
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
              width={70}
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
            <Legend verticalAlign="top" align="right" />
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
