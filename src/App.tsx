import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import { ContextProvider } from "./Context";
import LandingPage from "./pages/LandingPage";
import Lookup from "./pages/Lookup";
import VerifyRedirect from "./pages/VerifyRedirect";

const LegacyLookupRedirect = () => {
  const { address } = useParams();
  return <Navigate to={address ? `/address/${address}` : "/address"} replace />;
};

function App() {
  useEffect(() => {
    if (process.env.REACT_APP_TAG !== "master") {
      document.title = "(staging) sourcify.eth";
    }
  }, []);

  return (
    <div className="flex min-h-screen text-gray-800 bg-gray-50">
      <Tooltip id="global-tooltip" delayHide={300} clickable style={{ zIndex: 9999, maxWidth: "16rem", fontSize: "0.75rem" }} />
      <ContextProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/verifier" element={<VerifyRedirect />} />
            <Route path="/lookup" element={<LegacyLookupRedirect />} />
            <Route path="/lookup/:address" element={<LegacyLookupRedirect />} />
            <Route path="/address" element={<Lookup />} />
            <Route path="/address/:address" element={<Lookup />} />
            <Route path="/dataset-playground" element={<LandingPage />} />
            <Route path="/" element={<LandingPage />} />
          </Routes>
        </BrowserRouter>
      </ContextProvider>
    </div>
  );
}

export default App;
