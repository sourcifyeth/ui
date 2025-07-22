import Header from "../../components/Header";

const VerifyRedirect: React.FC = () => {
  const handleRedirect = () => {
    window.open(process.env.REACT_APP_VERIFY_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-100">
      <Header />
      <div className="flex flex-col w-full flex-1 max-w-[100rem] mx-auto pb-8 px-8 md:px-12 lg:px-24 justify-center items-center text-center">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Verification Has Moved!</h1>
          <p className="text-lg mb-8 text-gray-600">
            We've launched a new and improved verification interface using Sourcify's new APIv2.
          </p>
          <button
            onClick={handleRedirect}
            className="bg-ceruleanBlue-500 hover:bg-ceruleanBlue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200"
          >
            Go to New Verification UI
          </button>
          <p className="text-sm text-gray-400 mt-4">You will be redirected to {process.env.REACT_APP_VERIFY_URL}</p>
        </div>
      </div>
    </div>
  );
};

export default VerifyRedirect;
