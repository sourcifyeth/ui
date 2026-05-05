export interface VerifiedContractMinimal {
  match: "match" | "exact_match" | null;
  creationMatch: "match" | "exact_match" | null;
  runtimeMatch: "match" | "exact_match" | null;
  chainId: string;
  address: string;
  verifiedAt: string;
  matchId: string;
}

export interface AllChainsResponse {
  results: VerifiedContractMinimal[];
}

export type Chain = {
  name: string;
  title?: string;
  chainId: number;
  shortName: string;
  network: string;
  networkId: number;
  supported?: boolean;
  etherscanAPI?: boolean;
};

export type ChainMap = {
  [id: number]: Chain;
};
