export type CheckAllByAddressResult = {
  address: string;
  status?: string;
  chainIds: {
    chainId: string;
    status: string;
  }[];
};

export type Chain = {
  name: string;
  title?: string; // Longer name for some networks
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
