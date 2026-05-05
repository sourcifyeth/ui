import { SERVER_URL, BIGQUERY_API_URL } from "../constants";
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

export interface BigQueryResponse {
  ok: true;
  jobId: string;
  location: string;
  estimatedBytes: string;
  estimatedMiB: number;
  billedBytes: string;
  billedMiB: number;
  capBytes: string;
  capMiB: number;
  rowCount: number;
  rows: any[];
}

export const bigquery = async (sql: string): Promise<BigQueryResponse> => {
  const response = await fetch(`${BIGQUERY_API_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    let jsonError;
    try {
      jsonError = await response.json();
    } catch (e) {
      throw new Error("Cannot parse the error message");
    }
    throw new Error(jsonError.error || jsonError.message);
  }

  return await response.json();
};
