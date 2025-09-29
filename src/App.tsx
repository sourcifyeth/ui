import { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { ContextProvider } from "./Context";
import LandingPage from "./pages/LandingPage";
import Lookup from "./pages/Lookup";
import VerifyRedirect from "./pages/VerifyRedirect";

function App() {
  useEffect(() => {
    if (process.env.REACT_APP_TAG !== "master") {
      document.title = "(staging) sourcify.eth";
    }
  }, []);

  return (
    <div className="flex min-h-screen text-gray-800 bg-gray-50">
      <ContextProvider>
        <HashRouter>
          <Routes>
            <Route path="/verifier" element={<VerifyRedirect />} />
            <Route path="/lookup" element={<Lookup />} />
            <Route path="/lookup/:address" element={<Lookup />} />
            <Route path="/dataset-playground" element={<LandingPage />} />
            <Route path="/" element={<LandingPage />} />
          </Routes>
        </HashRouter>
      </ContextProvider>
    </div>
  );
}

export default App;
