import BigQueryExplorer from "../../components/BigQueryExplorer";
import Header from "../../components/Header";

const BigQuery = () => {
  return <div className="flex flex-col flex-1 bg-gray-100">
      <Header />
      <div className="flex flex-col flex-grow max-w-[100rem] w-full mx-auto pb-8 px-8 md:px-12 lg:px-24 bg-gray-100">
        <BigQueryExplorer />
      </div>
    </div>;
};

export default BigQuery;
