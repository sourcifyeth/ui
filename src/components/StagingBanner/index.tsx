// Shown only on non-production (staging/dev) deployments. Production builds
// set REACT_APP_TAG to "master"; anything else is treated as staging.
const isStaging = process.env.REACT_APP_TAG !== "master";

const StagingBanner = () => {
  if (!isStaging) {
    return null;
  }

  return (
    <div className="w-full bg-ceruleanBlue-500 text-white text-center font-medium py-3 px-4">
      🚧 You are on the <span className="font-bold">staging/dev</span> environment{" "}
      <span className="mx-1 text-xl align-middle">—</span>{" "}
      <span className="font-mono font-normal">{window.location.href}</span>
    </div>
  );
};

export default StagingBanner;
