import { useCallback, useContext, useEffect, useRef, useState } from "react";
import Header from "../../components/Header";
import PageLayout from "../../components/PageLayout";
import Toast from "../../components/Toast";
import { Context } from "../../Context";
import { AllChainsResponse } from "../../types";
import { getVerifiedContractAllChains } from "../../utils/api";
import Field from "./Field";
import Result from "./Result";
import { useParams, useNavigate } from "react-router-dom";
import { isAddress, getAddress } from "@ethersproject/address";

const Lookup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<AllChainsResponse | undefined>(undefined);
  const [displayAddress, setDisplayAddress] = useState<string | undefined>(undefined);
  const queriedAddressRef = useRef<string | undefined>(undefined);
  const { address } = useParams();
  const { errorMessage, setErrorMessage } = useContext(Context);

  const handleRequest = useCallback(
    async (_address: string) => {
      queriedAddressRef.current = _address;
      setLoading(true);
      try {
        const result = await getVerifiedContractAllChains(_address);
        setResponse(result);
        setDisplayAddress(_address);
        navigate(`/address/${_address}`);
      } catch (err: any) {
        queriedAddressRef.current = undefined;
        setErrorMessage(err.message || "An error occurred, try again!");
      } finally {
        setLoading(false);
      }
    },
    [navigate, setErrorMessage]
  );

  const goBack = () => {
    queriedAddressRef.current = undefined;
    setResponse(undefined);
    setDisplayAddress(undefined);
    navigate("/address");
  };

  // Only depends on the URL param — state changes from goBack cannot re-trigger this.
  useEffect(() => {
    if (!address) return;
    if (queriedAddressRef.current === address) return;
    if (!isAddress(address)) {
      setErrorMessage("Invalid contract address in URL");
      return;
    }
    const checksummedAddress = getAddress(address);
    queriedAddressRef.current = checksummedAddress;
    handleRequest(checksummedAddress);
  }, [address, handleRequest, setErrorMessage]);

  return (
    <div className="flex flex-col flex-1">
      <Header />
      <Toast message={errorMessage} isShown={!!errorMessage} dismiss={() => setErrorMessage("")} />
      <PageLayout title="Contract Lookup" subtitle="Look up verified contracts in the Sourcify repository" maxWidth="max-w-6xl">
        {response ? (
          <Result address={displayAddress!} response={response} goBack={goBack} />
        ) : (
          <Field loading={loading} handleRequest={handleRequest} />
        )}
      </PageLayout>
    </div>
  );
};

export default Lookup;
