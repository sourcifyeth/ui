import { defaultAbiCoder } from "@ethersproject/abi";
import { getAddress } from "@ethersproject/address";
import type { DisplayModel, TokenResult } from "@ethereum-sourcify/clear-signing";

// Clear signing for the hero lookup: fetch an Ethereum mainnet transaction and format it with ERC-7730.

const CHAIN_ID = 1;

// Public Ethereum mainnet RPCs that allow browser requests (CORS). Tried in this order; the next one is used when one fails.
// No API keys: anything in the website code is public.
const RPC_URLS = ["https://eth.drpc.org", "https://ethereum-rpc.publicnode.com", "https://rpc.flashbots.net"];
const RPC_TIMEOUT_MS = 8000;

export type MainnetTransaction = { hash: string; to: string | null; data: string; value: bigint; from: string };

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  let lastError: unknown;
  for (const url of RPC_URLS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      const json = await response.json();
      if (json.error) throw new Error(`${url}: ${json.error.message ?? "RPC error"}`);
      return json.result as T;
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All RPCs failed");
}

/** The transaction, or null when no mainnet transaction has this hash. */
export async function fetchMainnetTransaction(hash: string): Promise<MainnetTransaction | null> {
  const tx = await rpc<{ hash: string; to: string | null; input: string; value: string; from: string } | null>(
    "eth_getTransactionByHash",
    [hash],
  );
  if (!tx) return null;
  // RPCs return lowercase addresses; use the EIP-55 checksum form, like the rest of Sourcify
  return { hash: tx.hash, to: tx.to ? getAddress(tx.to) : null, data: tx.input, value: BigInt(tx.value), from: tx.from };
}

// ERC-20 metadata, read with eth_call. Some old tokens return bytes32 instead of string for name and symbol.
const ERC20 = { name: "0x06fdde03", symbol: "0x95d89b41", decimals: "0x313ce567" };
const tokenCache = new Map<string, Promise<TokenResult | null>>();

function decodeText(hex: string): string {
  try {
    return defaultAbiCoder.decode(["string"], hex)[0];
  } catch {
    const bytes = hex.replace(/^0x/, "").slice(0, 64).replace(/(00)+$/, "");
    return bytes.match(/../g)?.map((b) => String.fromCharCode(parseInt(b, 16))).join("") ?? "";
  }
}

async function resolveToken(chainId: number, address: string): Promise<TokenResult | null> {
  if (chainId !== CHAIN_ID) return null;
  const key = address.toLowerCase();
  if (!tokenCache.has(key)) {
    const call = (data: string) => rpc<string>("eth_call", [{ to: address, data }, "latest"]);
    tokenCache.set(
      key,
      Promise.all([call(ERC20.name), call(ERC20.symbol), call(ERC20.decimals)])
        .then(([name, symbol, decimals]) => ({
          name: decodeText(name),
          symbol: decodeText(symbol),
          decimals: Number(BigInt(decimals)),
        }))
        .catch(() => null),
    );
  }
  return tokenCache.get(key)!;
}

// The SDK and the registry index load on the first transaction lookup only, and are kept for later lookups.
let sdkPromise: Promise<typeof import("@ethereum-sourcify/clear-signing")> | null = null;
let indexPromise: Promise<unknown> | null = null;

export async function clearSign(tx: MainnetTransaction): Promise<DisplayModel> {
  sdkPromise ??= import("@ethereum-sourcify/clear-signing");
  const sdk = await sdkPromise;
  indexPromise ??= sdk.fetchPrebuiltRegistryIndex().catch((err) => {
    indexPromise = null; // try again on the next lookup
    throw err;
  });
  const index = (await indexPromise) as Awaited<ReturnType<typeof sdk.fetchPrebuiltRegistryIndex>>;
  return sdk.format(
    { chainId: CHAIN_ID, to: tx.to ?? "", data: tx.data, value: tx.value, from: tx.from },
    {
      descriptorResolverOptions: { type: "github", index },
      externalDataProvider: {
        resolveToken,
        resolveChainInfo: async (chainId) =>
          chainId === CHAIN_ID
            ? { name: "Ethereum", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 } }
            : null,
      },
    },
  );
}
