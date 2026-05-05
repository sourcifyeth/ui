import { useContext } from "react";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { IoOpenOutline } from "react-icons/io5";
import MatchBadge from "../../components/MatchBadge";
import { REPOSITORY_URL, VERIFY_URL } from "../../constants";
import { Context } from "../../Context";
import { AllChainsResponse, VerifiedContractMinimal } from "../../types";

type ResultProp = {
  address: string;
  response: AllChainsResponse;
  goBack: () => void;
};

const remixUrl = (chainId: string, address: string) =>
  `https://remix.ethereum.org/?#activate=contract-verification&call=contract-verification//lookupAndSave//sourcify//${chainId}//${address}`;

const repoUrl = (chainId: string, address: string) => `${REPOSITORY_URL}/${chainId}/${address}/`;



type ChainRowProps = {
  contract: VerifiedContractMinimal;
};

const ChainRow = ({ contract }: ChainRowProps) => {
  const { sourcifyChainMap } = useContext(Context);
  const chain = sourcifyChainMap[parseInt(contract.chainId)];
  const chainName = chain?.title || chain?.name || `Chain ${contract.chainId}`;
  const verifiedDate = new Date(contract.verifiedAt).toISOString().split("T")[0];

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 text-gray-900">
        <div className="text-base font-medium">{chainName}</div>
        <div className="text-gray-500 text-xs">Chain ID: {contract.chainId}</div>
      </td>
      <td className="px-6 py-4">
        <MatchBadge match={contract.creationMatch} small />
      </td>
      <td className="px-6 py-4">
        <MatchBadge match={contract.runtimeMatch} small />
      </td>
      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">{verifiedDate}</td>
      <td className="px-6 py-4">
        <div className="flex flex-col items-stretch gap-2">
          <a
            href={repoUrl(contract.chainId, contract.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-ceruleanBlue-500 hover:bg-ceruleanBlue-600 transition-colors whitespace-nowrap"
          >
            Sourcify Repo <IoOpenOutline className="w-3.5 h-3.5" />
          </a>
          <a
            href={remixUrl(contract.chainId, contract.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-ceruleanBlue-600 border border-ceruleanBlue-200 hover:bg-ceruleanBlue-50 transition-colors whitespace-nowrap"
          >
            Remix <IoOpenOutline className="w-3.5 h-3.5" />
          </a>
        </div>
      </td>
    </tr>
  );
};

const Result = ({ address, response, goBack }: ResultProp) => {
  const { results } = response;

  return (
    <div>
      {/* Header: back arrow + full address */}
      <div className="mb-6">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-ceruleanBlue-600 transition-colors mb-3"
          aria-label="Back to search"
        >
          <HiOutlineArrowLeft className="h-4 w-4" /> Back to search
        </button>
        <p className="font-mono text-lg md:text-xl font-semibold text-gray-900 break-all text-center">{address}</p>
      </div>

      {results.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Chain</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 min-w-[10rem]">Creation Match</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 min-w-[10rem]">Runtime Match</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Verified At</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-900 w-px">Source</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((contract) => (
                  <ChainRow key={`${contract.chainId}-${contract.matchId}`} contract={contract} />
                ))}
              </tbody>
            </table>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
          <p className="text-gray-700 mb-1">
            The contract at{" "}
            <span className="font-mono text-sm bg-gray-100 px-1.5 py-0.5 rounded break-all">{address}</span> is not
            verified on Sourcify.
          </p>
          <p className="text-gray-500 text-sm mb-4">Do you have the source code?</p>
          <a
            href={VERIFY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-ceruleanBlue-500 hover:bg-ceruleanBlue-600 focus:outline-none focus:ring-2 focus:ring-ceruleanBlue-500 focus:ring-offset-2 transition-colors"
          >
            Verify Contract
          </a>
        </div>
      )}

    </div>
  );
};

export default Result;
