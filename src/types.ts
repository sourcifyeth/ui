export declare interface StringMap {
  [key: string]: string;
}

export type Status = "perfect" | "partial" | "error";

export type ContractMeta = {
  compiledPath?: string;
  name?: string;
  address?: string;
  chainId?: string;
  status?: Status;
  statusMessage?: string;
  storageTimestamp?: Date;
};


export interface Match {
  address: string | null;
  chainId: string | null;
  status: Status;
  storageTimestamp?: Date;
  message?: string;
  abiEncodedConstructorArguments?: string;
  libraryMap?: StringMap;
}

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
