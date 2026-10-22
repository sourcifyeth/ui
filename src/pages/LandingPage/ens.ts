// ENS name -> Ethereum mainnet address, for the hero lookup box.
//
// The lookup has two steps, both with eth_call through the same public RPCs as the transaction lookup:
//   1. ENS registry: resolver(namehash(name)) gives the resolver contract of the name.
//   2. That resolver: addr(namehash(name)) gives the address.
// Both calls return zero for a name without a resolver or an address; they do not revert. So a failed call
// means a failed RPC, and the RPC fallback stays correct.
// Not supported: wildcard names (ENSIP-10) and offchain names (CCIP-Read, for example *.cb.id). For those,
// step 1 or 2 returns zero, and the box says that the name has no address.
import { getAddress } from "@ethersproject/address";
import { namehash } from "@ethersproject/hash";
import { rpc } from "./clearSigning";

const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const RESOLVER_SELECTOR = "0x0178b8bf"; // resolver(bytes32)
const ADDR_SELECTOR = "0x3b3b57de"; // addr(bytes32)

// A name with at least one dot, and no spaces, parentheses, commas or "*" (those are 4byte searches)
export const isEnsName = (query: string) => /^[^\s.(),*]+(\.[^\s.(),*]+)+$/.test(query) && !/^0x/i.test(query);

// The last 20 bytes of a 32-byte return value, or null for zero or an empty answer
const addressFromWord = (result: string): string | null => {
  if (!result || result.length < 66) return null;
  const address = "0x" + result.slice(26, 66);
  return /^0x0{40}$/.test(address) ? null : getAddress(address);
};

const call = (to: string, data: string) => rpc<string>("eth_call", [{ to, data }, "latest"]);

/**
 * The mainnet address of an ENS name, in checksum form, or null if the name has no address.
 * Throws if the name is not a valid ENS name, or if all RPCs fail.
 */
export async function resolveEnsName(name: string): Promise<string | null> {
  // namehash also normalizes the name (ENSIP-15), so "Uniswap.eth" and "uniswap.eth" give the same node
  const node = namehash(name).slice(2);
  const resolver = addressFromWord(await call(ENS_REGISTRY, RESOLVER_SELECTOR + node));
  if (!resolver) return null;
  return addressFromWord(await call(resolver, ADDR_SELECTOR + node));
}

export type AccountKind = "contract" | "account" | "delegated-account";

/**
 * What the address is on Ethereum mainnet: a contract, an account without code, or an account with an
 * EIP-7702 delegation (its code is 0xef0100 and the address of the delegate). Throws if all RPCs fail.
 */
export async function getMainnetAccountKind(address: string): Promise<AccountKind> {
  const code = await rpc<string>("eth_getCode", [address, "latest"]);
  if (!code || code === "0x") return "account";
  if (/^0xef0100/i.test(code)) return "delegated-account";
  return "contract";
}
