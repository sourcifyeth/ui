import { isAddress, getAddress } from "@ethersproject/address";
import { FormEventHandler, useState } from "react";
import LoadingOverlay from "../../components/LoadingOverlay";

type FieldProp = {
  loading: boolean;
  handleRequest: (address: string) => void;
};

const EXAMPLE_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

const Field = ({ loading, handleRequest }: FieldProp) => {
  const [value, setValue] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!isAddress(value)) {
      setError("Invalid contract address");
      return;
    }
    setError("");
    handleRequest(getAddress(value));
  };

  const handleExample = () => {
    setValue(EXAMPLE_ADDRESS);
    setError("");
    handleRequest(EXAMPLE_ADDRESS);
  };

  return (
    <div className="relative">
      {loading && <LoadingOverlay message="Looking up the contract" />}
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            id="contract-address"
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError("");
            }}
            placeholder="0x…"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ceruleanBlue-500 focus:border-ceruleanBlue-500"
          />
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-ceruleanBlue-500 hover:bg-ceruleanBlue-600 focus:outline-none focus:ring-2 focus:ring-ceruleanBlue-500 focus:ring-offset-2 transition-colors"
          >
            Look up
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        <div className="mt-2">
          <button
            type="button"
            onClick={handleExample}
            className="text-sm text-gray-500 hover:text-ceruleanBlue-500 underline"
          >
            Try an example contract
          </button>
        </div>
      </form>
    </div>
  );
};

export default Field;
