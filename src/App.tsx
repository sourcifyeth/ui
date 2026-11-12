import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import { ContextProvider } from "./Context";
import StagingBanner from "./components/StagingBanner";
import LandingPage from "./pages/LandingPage";
import VerifyRedirect from "./pages/VerifyRedirect";
import { DOCS_URL, IS_STAGING } from "./constants";

// The lookup page loads only when a visitor opens it, so its code is not in the main bundle.
const Lookup = lazy(() => import("./pages/Lookup"));

// The Dataset Playground is removed. Old links go to the BigQuery page of the docs.
const DatasetPlaygroundRedirect = () => {
  useEffect(() => {
    window.location.replace(`${DOCS_URL}/docs/bigquery/`);
  }, []);
  return null;
};

const LegacyLookupRedirect = () => {
  const { address } = useParams();
  return <Navigate to={address ? `/address/${address}` : "/address"} replace />;
};

function App() {
  useEffect(() => {
    if (IS_STAGING) {
      document.title = "(staging) sourcify.eth";
    }
  }, []);

  return (
    <>
      <StagingBanner />
      <div className="flex min-h-screen text-gray-800 bg-gray-50">
        <Tooltip id="global-tooltip" delayHide={300} clickable style={{ zIndex: 9999, maxWidth: "16rem", fontSize: "0.75rem" }} />
        <ContextProvider>
          <BrowserRouter>
            {/* While a lazy page loads: an empty page in the background color, so nothing jumps */}
            <Suspense fallback={<div className="min-h-screen w-full bg-gray-100" />}>
              <Routes>
                <Route path="/verifier" element={<VerifyRedirect />} />
                <Route path="/lookup" element={<LegacyLookupRedirect />} />
                <Route path="/lookup/:address" element={<LegacyLookupRedirect />} />
                <Route path="/address" element={<Lookup />} />
                <Route path="/address/:address" element={<Lookup />} />
                <Route path="/dataset-playground" element={<DatasetPlaygroundRedirect />} />
                <Route path="/" element={<LandingPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ContextProvider>
      </div>
    </>
  );
}

export default App;
