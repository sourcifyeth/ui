import { isAddress, getAddress } from "@ethersproject/address";
import { useState } from "react";
import LoadingOverlay from "../../components/LoadingOverlay";

type FieldProp = {
  loading: boolean;
  handleRequest: (address: string) => void;
};

const EXAMPLE_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

const Field = ({ loading, handleRequest }: FieldProp) => {
  const [value, setValue] = useState<string>("");
  const [touched, setTouched] = useState<boolean>(false);
  // Show error once they've typed enough to be attempting an address, or after blur
  const invalid = value.length > 0 && !isAddress(value) && (touched || value.length >= 42);

  const handleChange = (input: string) => {
    setValue(input);
    if (isAddress(input)) {
      handleRequest(getAddress(input));
    }
  };

  return (
    <div className="relative">
      {loading && <LoadingOverlay message="Looking up the contract" />}
      <input
        id="contract-address"
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder="0x…"
        className={`w-full px-3 py-2 border rounded-md shadow-sm font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ceruleanBlue-500 focus:border-ceruleanBlue-500 ${
          invalid ? "border-red-400" : "border-gray-300"
        }`}
      />
      {invalid && <p className="text-sm text-red-600 mt-1">Invalid contract address</p>}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => handleChange(EXAMPLE_ADDRESS)}
          className="text-sm text-gray-500 hover:text-ceruleanBlue-500 underline"
        >
          Try an example contract
        </button>
      </div>
    </div>
  );
};

export default Field;
