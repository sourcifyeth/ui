import { FormEvent, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCheck, FiSearch, FiX } from "react-icons/fi";
import { FaFileSignature, FaHashtag } from "react-icons/fa";
import { IoCheckmarkDoneCircle } from "react-icons/io5";
import { IconType } from "react-icons";
import { id as keccakOfText } from "@ethersproject/hash";
import type { DisplayField, DisplayFieldGroup, DisplayModel } from "@ethereum-sourcify/clear-signing";
import MatchBadge from "../../components/MatchBadge";
import { Context } from "../../Context";
import { REPOSITORY_URL } from "../../constants";
import { getVerifiedContractAllChains } from "../../utils/api";
import { VerifiedContractMinimal } from "../../types";
import useLiveStats from "./useLiveStats";
import { clearSign, fetchMainnetTransaction, MainnetTransaction } from "./clearSigning";

// Hero variant D: "Make Ethereum readable." with one lookup box for contracts, signatures and transactions.

const FOURBYTE_API = "https://api.4byte.sourcify.dev/signature-database/v1";
const CLEAR_SIGNING_PLAYGROUND_URL = "https://clear-signing.sourcify.dev";
const REGISTRY_URL = "https://github.com/ethereum/clear-signing-erc7730-registry";
// Chains shown in the address result before "more chains"
const MAX_CHAINS = 4;
// Signatures shown in a 4byte result
const MAX_SIGNATURES = 5;
// Calldata characters shown on the "blind signing" side
const MAX_CALLDATA_CHARS = 330;

type Kind = "address" | "selector" | "hash" | "signature" | "name";

type Signature = { name: string; hasVerifiedContract: boolean };
type SignatureGroup = { hash: string; items: Signature[]; type: string };

type Result =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | { status: "invalid"; query: string }
  | { status: "error"; query: string }
  | { status: "not-found"; query: string }
  | { status: "contract"; query: string; contracts: VerifiedContractMinimal[] }
  | { status: "signatures"; kind: Kind; query: string; signatures: SignatureGroup[] }
  | {
      status: "transaction";
      query: string;
      tx: MainnetTransaction;
      display: DisplayModel | null;
      contract: VerifiedContractMinimal | null;
      functionNames: string[];
    };

// The three things the box can look up. Each example fills the box and runs the lookup.
const TRY_GROUPS: { title: string; icon: IconType; iconClassName: string; examples: { value: string; prefix: string; label?: string }[] }[] = [
  {
    title: "Verified Contracts",
    icon: IoCheckmarkDoneCircle,
    iconClassName: "bg-green-100 text-green-800 border border-green-200 text-base",
    examples: [{ prefix: "Contract", value: "0x1F98431c8aD98523631AE4a59f267346ea31F984" }], // Uniswap V3 Factory
  },
  {
    title: "4byte Selectors",
    icon: FaHashtag,
    iconClassName: "bg-ceruleanBlue-50 text-ceruleanBlue-500 text-xs",
    examples: [
      { prefix: "Function", value: "0xa9059cbb" },
      { prefix: "Event", value: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" },
      { prefix: "Signature", value: "transfer(address,uint256)" },
    ],
  },
  {
    title: "Clear Sign Transactions",
    icon: FaFileSignature,
    iconClassName: "bg-ceruleanBlue-50 text-ceruleanBlue-500 text-xs",
    examples: [
      // Mainnet transactions to contracts covered by the ERC-7730 registry (from the Clear Signing playground examples).
      // Checked on 20 Oct 2026: both render with a descriptor. The playground's USDC example has no descriptor any more.
      { prefix: "Tx", label: "Uniswap swap", value: "0x675a2e96e48b77e5d8edc16bfc4dc2ea7547f950edb76fdeff40e8af250d897e" },
      { prefix: "Tx", label: "Aave supply", value: "0xb0bd1c520f3b43405bb23f94f2a7f18e0fd0b671dc606516f3d0f9c9a199b608" },
    ],
  },
];

// Reads what was pasted: a 20-byte address, a 4-byte selector, a 32-byte hash (transaction or event topic),
// a full signature like transfer(address,uint256), or a bare name to search for
const kindOf = (query: string): Kind | null => {
  if (/^0x[0-9a-fA-F]{40}$/.test(query)) return "address";
  if (/^0x[0-9a-fA-F]{8}$/.test(query)) return "selector";
  if (/^0x[0-9a-fA-F]{64}$/.test(query)) return "hash";
  if (/^0x/i.test(query)) return null;
  if (/^[A-Za-z_$][A-Za-z0-9_$]*\(.*\)$/.test(query)) return "signature";
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(query)) return "name";
  return null;
};

// Chips: long hex values keep their first CHIP_HASH_CHARS characters, so the start of the hash is easy to recognize
const CHIP_HASH_CHARS = 18;
const chipValue = (value: string) =>
  /^0x/i.test(value) && value.length > CHIP_HASH_CHARS ? `${value.slice(0, CHIP_HASH_CHARS)}…` : value;

// Results: shortens long hex values in the middle; names and signatures stay as they are
const short = (value: string) => (/^0x/i.test(value) && value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value);

const formatCompact = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n);

const chainLabel = (chainMap: Record<number, { title?: string; name: string }>, chainId: string) => {
  const chain = chainMap[parseInt(chainId)];
  return chain?.title || chain?.name || `Chain ${chainId}`;
};

async function lookUpSignatures(kind: Kind, query: string): Promise<SignatureGroup[]> {
  let url: string;
  if (kind === "signature") {
    // A full signature: its keccak256 is the event topic, and the first 4 bytes are the function or error selector
    const topic = keccakOfText(query.replace(/\s+/g, ""));
    url = `${FOURBYTE_API}/lookup?function=${topic.slice(0, 10)}&event=${topic}`;
  } else if (kind === "name") {
    // The "(" keeps the search to this exact name with any arguments
    url = `${FOURBYTE_API}/search?query=${encodeURIComponent(`${query}(`)}*`;
  } else {
    url = `${FOURBYTE_API}/lookup?${kind === "hash" ? "event" : "function"}=${query}`;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`4byte lookup failed: ${response.status}`);
  const json = await response.json();
  // A 4-byte hash is a function or an error selector; a 32-byte hash is an event topic
  const groups: SignatureGroup[] = [
    ...Object.entries((json.result?.function ?? {}) as Record<string, Signature[]>).map(([hash, items]) => ({ hash, items, type: "Function" })),
    ...Object.entries((json.result?.event ?? {}) as Record<string, Signature[]>).map(([hash, items]) => ({ hash, items, type: "Event" })),
  ];
  return groups
    .filter(({ items }) => items.length > 0)
    // Signatures used in a verified contract first
    .sort((a, b) => Number(b.items.some((s) => s.hasVerifiedContract)) - Number(a.items.some((s) => s.hasVerifiedContract)))
    .slice(0, MAX_SIGNATURES);
}

// A transaction: format it with ERC-7730, and check its contract and function name with Sourcify and 4byte
async function lookUpTransaction(tx: MainnetTransaction) {
  const selector = tx.data.length >= 10 ? tx.data.slice(0, 10) : null;
  const [display, contracts, names] = await Promise.all([
    tx.to ? clearSign(tx).catch(() => null) : Promise.resolve(null),
    tx.to ? getVerifiedContractAllChains(tx.to).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
    selector ? lookUpSignatures("selector", selector).catch(() => []) : Promise.resolve([]),
  ]);
  return {
    display,
    contract: contracts.results.find((c) => c.chainId === "1") ?? null,
    functionNames: names.flatMap((g) => g.items.map((s) => s.name)),
  };
}

const ContractResult = ({ query, contracts }: { query: string; contracts: VerifiedContractMinimal[] }) => {
  const { sourcifyChainMap } = useContext(Context);
  if (contracts.length === 0) {
    return (
      <p className="text-gray-700">
        This address is not verified on Sourcify yet.{" "}
        <a href={process.env.REACT_APP_VERIFY_URL} className="text-ceruleanBlue-500 font-medium link-underline">
          Verify it
        </a>
      </p>
    );
  }
  // Ethereum mainnet first, then exact matches, then by chain id
  const sorted = [...contracts].sort(
    (a, b) =>
      Number(b.chainId === "1") - Number(a.chainId === "1") ||
      Number(b.match === "exact_match") - Number(a.match === "exact_match") ||
      Number(a.chainId) - Number(b.chainId),
  );
  const shown = sorted.slice(0, MAX_CHAINS);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-gray-700">
        Verified on <strong>{contracts.length}</strong> {contracts.length === 1 ? "chain" : "chains"}.
      </p>
      <ul className="flex flex-col divide-y divide-gray-100">
        {shown.map((c) => (
          <li key={c.chainId} className="flex items-center gap-3 py-2">
            <span className="min-w-0 flex-1 truncate text-gray-800">{chainLabel(sourcifyChainMap, c.chainId)}</span>
            <MatchBadge match={c.match} small />
            <SourceLink chainId={c.chainId} address={c.address} />
          </li>
        ))}
      </ul>
      {contracts.length > shown.length && (
        <Link to={`/address/${query}`} className="self-start text-sm text-ceruleanBlue-500 font-medium link-underline">
          See all {contracts.length} chains
        </Link>
      )}
    </div>
  );
};

const SourceLink = ({ chainId, address }: { chainId: string; address: string }) => (
  <a
    href={`${REPOSITORY_URL}/${chainId}/${address}/`}
    target="_blank"
    rel="noopener noreferrer"
    className="text-sm text-ceruleanBlue-500 font-medium link-underline whitespace-nowrap"
  >
    {/* Short label on phones, so the name next to it keeps its room */}
    <span className="hidden sm:inline">Read the source</span>
    <span className="sm:hidden">Source</span>
  </a>
);

const SignatureResult = ({ kind, signatures }: { kind: Kind; signatures: SignatureGroup[] }) => {
  if (signatures.length === 0) {
    return (
      <p className="text-gray-700">
        No signature found for this {kind === "name" ? "name" : kind === "signature" ? "signature" : "hash"} in the 4byte
        database.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-gray-700">
        {kind === "hash"
          ? "Event"
          : kind === "selector"
            ? "Function or error"
            : kind === "signature"
              ? "Selector and topic of this signature"
              : "Signatures with this name"}{" "}
        from the 4byte database:
      </p>
      <ul className="flex flex-col divide-y divide-gray-100">
        {signatures.flatMap(({ hash, items, type }) =>
          items.map((s) => (
            <li key={hash + s.name} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
              <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-500">{type}</span>
              <code className="font-mono text-xs text-gray-500">{short(hash)}</code>
              <code className="min-w-0 break-all font-mono text-sm text-gray-900">{s.name}</code>
              {s.hasVerifiedContract && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                  <FiCheck aria-hidden="true" /> Used in a verified contract
                </span>
              )}
            </li>
          )),
        )}
      </ul>
      <a
        href="https://4byte.sourcify.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="self-start text-sm text-ceruleanBlue-500 font-medium link-underline"
      >
        Open 4byte.sourcify.dev
      </a>
    </div>
  );
};

const isGroup = (f: DisplayField | DisplayFieldGroup): f is DisplayFieldGroup => "fields" in f;

const FieldRows = ({ fields }: { fields: DisplayField[] }) => (
  <>
    {fields.map((f, i) => (
      <div key={f.label + i} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-4">
        <dt className="text-gray-400 sm:w-28 sm:shrink-0">{f.separator ? `${f.separator} · ${f.label}` : f.label}</dt>
        <dd className="min-w-0 break-all text-gray-100">{f.value}</dd>
      </div>
    ))}
  </>
);

const TransactionResult = ({ result }: { result: Extract<Result, { status: "transaction" }> }) => {
  const { tx, display, contract, functionNames } = result;
  const hasDescriptor = display && !display.rawCalldataFallback && (display.intent || display.fields?.length);
  const intent =
    typeof display?.intent === "string"
      ? display.intent
      : display?.intent
        ? Object.entries(display.intent).map(([k, v]) => `${k}: ${v}`).join(" · ")
        : null;
  const calldata = tx.data.length > MAX_CALLDATA_CHARS ? `${tx.data.slice(0, MAX_CALLDATA_CHARS)}…` : tx.data;

  if (!tx.to) {
    return <p className="text-gray-700">This transaction creates a contract, so there is no call to show in plain words.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-gray-700">
        Ethereum transaction <code className="font-mono text-sm">{short(tx.hash)}</code> to{" "}
        <code className="font-mono text-sm">{short(tx.to)}</code>
      </p>

      {/* Blind signing next to clear signing */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-[#111827] p-4">
          <span className="self-start rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-semibold text-gray-200">Blind signing</span>
          <p className="text-xs text-gray-400">What a wallet without clear signing shows:</p>
          <code className="break-all font-mono text-xs leading-relaxed text-gray-300">
            <span className="text-amber-300">{calldata.slice(0, 10)}</span>
            {calldata.slice(10)}
          </code>
        </div>
        <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-[#111827] p-4">
          <span className="self-start rounded-full bg-ceruleanBlue-500 px-2.5 py-0.5 text-xs font-semibold text-white">Clear signing</span>
          {hasDescriptor ? (
            <>
              {intent && <p className="text-lg font-semibold text-white">{intent}</p>}
              {display?.interpolatedIntent && <p className="text-sm text-gray-300">{display.interpolatedIntent}</p>}
              <dl className="divide-y divide-gray-700 text-sm">
                {(display?.fields ?? []).map((f, i) =>
                  isGroup(f) ? (
                    <div key={i}>
                      {f.label && <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{f.label}</p>}
                      <FieldRows fields={f.fields} />
                    </div>
                  ) : (
                    <FieldRows key={i} fields={[f]} />
                  ),
                )}
              </dl>
              {display?.metadata?.contractName && (
                <p className="text-xs text-gray-400">
                  Contract: {display.metadata.contractName}
                  {display.metadata.owner ? ` by ${display.metadata.owner}` : ""}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-gray-300">
                No ERC-7730 descriptor for this contract yet, so wallets cannot show this call in plain words.
              </p>
              {functionNames.length > 0 && (
                <p className="text-sm text-gray-300">
                  From 4byte, the function is <code className="font-mono text-green-300">{functionNames[0]}</code>.
                </p>
              )}
              <a href={REGISTRY_URL} target="_blank" rel="noopener noreferrer" className="self-start text-sm font-medium text-ceruleanBlue-300 link-underline">
                Add a descriptor to the registry
              </a>
            </>
          )}
        </div>
      </div>

      {/* The same transaction, one layer down: is the contract it calls verified? */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-gray-100 pt-3 text-sm">
        <span className="text-gray-500">Contract source:</span>
        {contract ? (
          <>
            <MatchBadge match={contract.match} small />
            <SourceLink chainId="1" address={contract.address} />
          </>
        ) : (
          <span className="text-gray-700">not verified on Sourcify</span>
        )}
        <a
          href={CLEAR_SIGNING_PLAYGROUND_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-ceruleanBlue-500 font-medium link-underline"
        >
          Open the Clear Signing playground
        </a>
      </div>
    </div>
  );
};

const HeroReadable = () => {
  const { sourcifyChains } = useContext(Context);
  const live = useLiveStats(true);
  const [signatureCount, setSignatureCount] = useState<number | null>(null);
  // The daily stats.json total, used until the live total arrives (the same fallback as the stats section)
  const [dailyTotal, setDailyTotal] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [result, setResultState] = useState<Result>({ status: "idle" });

  useEffect(() => {
    fetch(`${FOURBYTE_API}/stats`)
      .then((r) => r.json())
      .then((json) => setSignatureCount(json.result?.count?.total ?? null))
      .catch(() => setSignatureCount(null));
    fetch(`https://${process.env.REACT_APP_TAG === "staging" ? "staging." : ""}sourcify.dev/static/stats.json`)
      .then((r) => r.json())
      .then((stats: Record<string, { full_match: number; partial_match: number }>) =>
        setDailyTotal(Object.values(stats).reduce((sum, s) => sum + s.full_match + s.partial_match, 0)),
      )
      .catch(() => setDailyTotal(null));
  }, []);
  const contractCount = live.total ?? dailyTotal;

  // The result overlay. Each lookup gets a number; an answer that arrives after a newer lookup or after the
  // overlay was closed is dropped, so a slow answer never opens the overlay again.
  const lookupRef = useRef<HTMLDivElement>(null);
  const lookupIdRef = useRef(0);
  const isOpen = result.status !== "idle";
  const closeResult = useCallback(() => {
    lookupIdRef.current++;
    setResultState({ status: "idle" });
  }, []);
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && closeResult();
    const onPointerDown = (e: PointerEvent) => {
      if (lookupRef.current && !lookupRef.current.contains(e.target as Node)) closeResult();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen, closeResult]);

  const lookUp = async (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    const id = ++lookupIdRef.current;
    const setResult = (next: Result) => id === lookupIdRef.current && setResultState(next);
    const kind = kindOf(q);
    if (!kind) {
      setResult({ status: "invalid", query: q });
      return;
    }
    setResult({ status: "loading", query: q });
    try {
      if (kind === "address") {
        const response = await getVerifiedContractAllChains(q);
        setResult({ status: "contract", query: q, contracts: response.results });
      } else if (kind === "hash") {
        // 32 bytes can be a transaction hash or an event topic: look up both at once
        const [tx, signatures] = await Promise.all([
          fetchMainnetTransaction(q).catch(() => null),
          lookUpSignatures("hash", q).catch(() => [] as SignatureGroup[]),
        ]);
        if (tx) {
          setResult({ status: "transaction", query: q, tx, ...(await lookUpTransaction(tx)) });
        } else if (signatures.length > 0) {
          setResult({ status: "signatures", kind, query: q, signatures });
        } else {
          setResult({ status: "not-found", query: q });
        }
      } else {
        setResult({ status: "signatures", kind, query: q, signatures: await lookUpSignatures(kind, q) });
      }
    } catch {
      setResult({ status: "error", query: q });
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    lookUp(query);
  };

  const chainCount = sourcifyChains.filter((c) => c.supported).length;
  const proof = [
    contractCount !== null && { value: formatCompact(contractCount), label: "contracts verified" },
    signatureCount !== null && { value: formatCompact(signatureCount), label: "signatures" },
    chainCount > 0 && { value: String(chainCount), label: "chains" },
    { value: "Daily", label: "open dataset" },
  ].filter(Boolean) as { value: string; label: string }[];

  let resultBody: ReactNode = null;
  switch (result.status) {
    case "loading":
      resultBody = <p className="text-gray-500">Looking up {short(result.query)}…</p>;
      break;
    case "invalid":
      resultBody = (
        <p className="text-gray-700">
          Sourcify cannot read <code className="font-mono">{short(result.query)}</code>. Paste a contract address (0x and 40
          hex characters), a transaction hash or event topic (0x and 64), a selector (0x and 8), a signature like{" "}
          <code className="font-mono">transfer(address,uint256)</code>, or a function name.
        </p>
      );
      break;
    case "error":
      resultBody = <p className="text-gray-700">The lookup did not work. Check your connection and try again.</p>;
      break;
    case "not-found":
      resultBody = (
        <p className="text-gray-700">
          No Ethereum transaction and no event topic has the hash <code className="font-mono">{short(result.query)}</code>.
          Transactions are looked up on Ethereum mainnet only.
        </p>
      );
      break;
    case "contract":
      resultBody = <ContractResult query={result.query} contracts={result.contracts} />;
      break;
    case "signatures":
      resultBody = <SignatureResult kind={result.kind} signatures={result.signatures} />;
      break;
    case "transaction":
      resultBody = <TransactionResult result={result} />;
      break;
  }

  return (
    // Full screen height, like the original hero: -mt-20 pt-20 lets the section start under the header
    <section className="min-h-screen -mt-20 pt-20 flex flex-col items-center justify-center px-4 pb-12 text-center">
      {/* 66rem: room for the lookup area on large screens; the headline and subline set their own widths */}
      <div className="flex w-full max-w-[66rem] flex-col items-center">
        <h1
          className="text-5xl md:text-7xl font-bold tracking-tight text-gray-800 opacity-0 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          Make Ethereum <span className="text-ceruleanBlue-500">readable</span>.
        </h1>
        <p
          className="mt-4 max-w-2xl text-lg md:text-xl text-gray-600 opacity-0 animate-fade-up"
          style={{ animationDelay: "250ms" }}
        >
          Sourcify matches Ethereum contracts to their source code and turns bytecode into names and clear transactions.
          <span className="mt-2 block font-semibold text-gray-700">Open source. Open data.</span>
        </p>

        {/* relative z-20: the result overlay must show above the links, numbers and sections that follow */}
        <div
          className="relative z-20 mt-8 w-full max-w-[50rem] lg:max-w-[66rem] opacity-0 animate-fade-up"
          style={{ animationDelay: "400ms" }}
        >
          {/* Lookup: one box for contracts, signatures and transactions. The result opens over the page below it. */}
          <div className="relative" ref={lookupRef}>
          <form
            onSubmit={onSubmit}
            role="search"
            aria-label="Look up a contract, signature or transaction"
            className="flex items-center gap-2 rounded-2xl bg-white p-2 pl-4 shadow-lg ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-ceruleanBlue-500"
          >
            <FiSearch className="shrink-0 text-gray-400" aria-hidden="true" />
            <label htmlFor="hero-lookup" className="sr-only">
              Contract address, transaction hash, selector, topic or signature
            </label>
            <input
              id="hero-lookup"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Paste an address, transaction hash or selector"
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent py-2 font-mono text-sm md:text-base text-gray-900 placeholder:font-sans placeholder:text-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-ceruleanBlue-500 px-4 py-2.5 text-sm md:text-base font-semibold text-white hover:bg-ceruleanBlue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceruleanBlue-300"
            >
              Look up
            </button>
          </form>

          {result.status !== "idle" && (
            <div
              role="dialog"
              aria-label="Lookup result"
              className="absolute inset-x-0 top-full mt-2 max-h-[min(70vh,44rem)] overflow-y-auto rounded-2xl bg-white text-left shadow-2xl ring-1 ring-gray-200"
            >
              {/* Header: which of the three lookups this is (the same names as the Try rows), and the close button */}
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-2 md:px-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {result.status === "contract"
                    ? "Verified contract"
                    : result.status === "signatures"
                      ? "Signatures"
                      : result.status === "transaction"
                        ? "ERC7730 Clear Signing"
                        : "Lookup"}
                </span>
                <button
                  type="button"
                  onClick={closeResult}
                  aria-label="Close the result"
                  className="-mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceruleanBlue-500"
                >
                  <FiX aria-hidden="true" />
                </button>
              </div>
              <div className="p-4 md:p-5" aria-live="polite">
                {resultBody}
              </div>
            </div>
          )}
          </div>

          {/* Try: a call to action, then the three kinds of lookup, one line each, in one frame with lines between them.
              The left part has a fixed width on large screens, so the examples line up across the rows. */}
          <div className="mt-4 overflow-hidden rounded-2xl bg-white/70 text-left ring-1 ring-gray-200 divide-y divide-gray-200">
            <div className="flex flex-wrap items-baseline gap-x-2 bg-ceruleanBlue-50/60 px-4 py-2">
              <span className="text-sm font-semibold text-ceruleanBlue-600">Try it out</span>
              <span className="text-sm text-gray-500">Pick an example, or paste your own above.</span>
            </div>
            {TRY_GROUPS.map(({ title, icon: Icon, iconClassName, examples }) => (
              <div key={title} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 lg:flex-nowrap">
                <div className="flex min-w-0 items-center gap-2.5 lg:w-56 lg:shrink-0">
                  <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${iconClassName}`}>
                    <Icon aria-hidden="true" />
                  </span>
                  <p className="min-w-0 font-semibold text-gray-800 lg:whitespace-nowrap">{title}</p>
                </div>
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {examples.map(({ label, value, prefix }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setQuery(value);
                        lookUp(value);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 ring-1 ring-gray-200 hover:ring-ceruleanBlue-500"
                      title={value}
                    >
                      {/* A short kind in front, then the value. Transactions also get a small label after the value. */}
                      <span className="text-xs font-semibold text-gray-500">{prefix}</span>
                      <code className="rounded bg-gray-100 px-1 font-mono text-[13px] text-gray-800">{chipValue(value)}</code>
                      {label && <span className="text-[11px] text-gray-500">{label}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-base opacity-0 animate-fade-up"
          style={{ animationDelay: "550ms" }}
        >
          <a
            href={process.env.REACT_APP_VERIFY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-ceruleanBlue-500 link-underline"
          >
            Verify a contract <FiArrowRight aria-hidden="true" />
          </a>
          <a href="https://docs.sourcify.dev" className="inline-flex items-center gap-1 font-semibold text-gray-600 link-underline">
            Documentation <FiArrowRight aria-hidden="true" />
          </a>
        </div>

        {/* Proof row: live numbers, each shown only once it has loaded */}
        <dl
          className="mt-6 md:mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 opacity-0 animate-fade-up"
          style={{ animationDelay: "700ms" }}
        >
          {proof.map(({ value, label }) => (
            <div key={label} className="flex items-baseline gap-1.5">
              <dt className="sr-only">{label}</dt>
              <dd className="text-xl md:text-2xl font-bold tabular-nums text-gray-800">{value}</dd>
              <span className="text-sm text-gray-500" aria-hidden="true">
                {label}
              </span>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

export default HeroReadable;
