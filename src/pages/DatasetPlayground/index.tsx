import Header from "../../components/Header";
import Footer from "../../components/Footer";
import BigQueryExplorer from "../../components/BigQueryExplorer";

// The BigQuery AI Dataset Playground on its own page. It was a section of the landing page.
const DatasetPlayground = () => (
  <div className="flex min-h-screen w-full flex-col bg-gray-100">
    <Header />
    <main className="flex-1">
      <BigQueryExplorer />
    </main>
    <Footer />
  </div>
);

export default DatasetPlayground;
