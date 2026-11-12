import { SERVER_URL } from "../constants";
import { AllChainsResponse, Chain } from "../types";

export const getVerifiedContractAllChains = async (address: string): Promise<AllChainsResponse> => {
  const response = await fetch(`${SERVER_URL}/v2/contract/all-chains/${address}`);
  if (response.status === 404) return { results: [] };
  if (!response.ok) throw new Error(`Lookup failed: ${response.status} ${response.statusText}`);
  return response.json();
};

export const getSourcifyChains = async (): Promise<Chain[]> => {
  const chainsArray = await (await fetch(`${SERVER_URL}/chains`)).json();
  return chainsArray;
};
