import { useState } from "react";

// Shown only on non-production (staging/dev) deployments. Production builds
// set REACT_APP_TAG to "master"; anything else is treated as staging.
const isStaging = process.env.REACT_APP_TAG !== "master";

const StagingBanner = () => {
  // Kept in memory only, so the banner comes back on every page load.
  const [isClosed, setIsClosed] = useState(false);

  if (!isStaging || isClosed) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 w-full bg-ceruleanBlue-500 text-white text-center font-medium py-3 pl-4 pr-12">
      🚧 You are on the <span className="font-bold">staging/dev</span> environment{" "}
      <span className="mx-1 text-xl align-middle">—</span>{" "}
      <span className="font-mono font-normal">{window.location.href}</span>
      <button
        type="button"
        onClick={() => setIsClosed(true)}
        aria-label="Close staging banner"
        title="Close"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 text-2xl leading-none text-white/80 hover:text-white hover:bg-white/10"
      >
        ×
      </button>
    </div>
  );
};

export default StagingBanner;
