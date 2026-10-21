import { FormEvent, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { FiArrowRight, FiSearch, FiX } from "react-icons/fi";
import { FaArrowRight, FaFileSignature, FaHashtag } from "react-icons/fa";
import { IoCheckmarkCircle, IoCheckmarkDoneCircle, IoChevronForward, IoCloseCircle } from "react-icons/io5";
import { IconType } from "react-icons";
import { id as keccakOfText } from "@ethersproject/hash";
import type { DisplayField, DisplayFieldGroup, DisplayModel } from "@ethereum-sourcify/clear-signing";
import { Context } from "../../Context";
import { IS_STAGING, REPOSITORY_URL } from "../../constants";
import { getVerifiedContractAllChains } from "../../utils/api";
import { VerifiedContractMinimal } from "../../types";
import useLiveStats from "./useLiveStats";
import { clearSign, fetchMainnetTransaction, MainnetTransaction } from "./clearSigning";
import ReadableWord from "./ReadableWord";

// The landing page hero: "Make Ethereum readable." with one lookup box for contracts, signatures and transactions.

// Staging builds, Netlify previews and the dev server read the staging 4byte database, like the other stats
const FOURBYTE_HOST = IS_STAGING ? "4byte.staging.sourcify.dev" : "4byte.sourcify.dev";
const FOURBYTE_API = `https://api.${FOURBYTE_HOST}/signature-database/v1`;
const CLEAR_SIGNING_PLAYGROUND_URL = "https://clear-signing.sourcify.dev";
const REGISTRY_URL = "https://github.com/ethereum/clear-signing-erc7730-registry";
// Signatures shown in a 4byte result
const MAX_SIGNATURES = 8;
// Calldata characters shown on the "blind signing" side
const MAX_CALLDATA_CHARS = 2000; // enough to fill the column, which cuts it off and fades it out

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
    // Checked on 20 Oct 2026 with the all-chains API: Safe 1.4.1 singleton is verified on 222 chains (221 exact);
    // the Ethereum Deposit Contract and DAI are exact matches on Ethereum mainnet.
    examples: [
      { prefix: "Contract", value: "0x41675C099F32341bf84BFc5382aF534df5C7461a" }, // Safe 1.4.1 singleton
      { prefix: "Contract", value: "0x00000000219ab540356cBB839Cbe05303d7705Fa" }, // Ethereum Deposit Contract
      { prefix: "Contract", value: "0x6B175474E89094C44Da98b954EedeAC495271d0F" }, // DAI
    ],
  },
  {
    title: "4byte Selectors",
    icon: FaHashtag,
    iconClassName: "bg-ceruleanBlue-50 text-ceruleanBlue-500 text-xs",
    examples: [
      { prefix: "Function", value: "0xa9059cbb" },
      // Uniswap V2 Swap(address,uint256,uint256,uint256,uint256,address): common and different from the transfer example
      { prefix: "Event", value: "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822" },
      // Timed on 20 Oct 2026: "name(*" searches answer in about 0.3s, and every flashLoan result is a real
      // flash-loan interface. Bare prefixes like "transfer*" took 1-7s and start with junk names.
      { prefix: "Wildcard", value: "flashLoan(*" },
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
// a full signature like transfer(address,uint256), a wildcard search like swapExact*, or a bare name to search for
const kindOf = (query: string): Kind | null => {
  if (/^0x[0-9a-fA-F]{40}$/.test(query)) return "address";
  if (/^0x[0-9a-fA-F]{8}$/.test(query)) return "selector";
  if (/^0x[0-9a-fA-F]{64}$/.test(query)) return "hash";
  if (/^0x/i.test(query)) return null;
  // A "*" anywhere makes it a 4byte text search, the same as on 4byte.sourcify.dev
  if (query.includes("*") && /^[A-Za-z0-9_$*(),[\] ]+$/.test(query)) return "name";
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

// Whole GB below 1 TB, then TB with one decimal (decimal units, the same as the stats section)
const formatSize = (bytes: number) => (bytes >= 1e12 ? `${(bytes / 1e12).toFixed(1)} TB` : `${Math.round(bytes / 1e9)} GB`);

const formatCompact = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n);


async function lookUpSignatures(kind: Kind, query: string): Promise<SignatureGroup[]> {
  let url: string;
  if (kind === "signature") {
    // A full signature: its keccak256 is the event topic, and the first 4 bytes are the function or error selector
    const topic = keccakOfText(query.replace(/\s+/g, ""));
    url = `${FOURBYTE_API}/lookup?function=${topic.slice(0, 10)}&event=${topic}`;
  } else if (kind === "name") {
    // A wildcard search goes to 4byte as typed. A bare name gets "(*", which keeps the search to that exact name
    // with any arguments.
    url = `${FOURBYTE_API}/search?query=${encodeURIComponent(query.includes("*") ? query : `${query}(*`)}`;
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

// Result styles follow the lookup dropdown of repo.sourcify.dev: a gray panel, white lists with thin lines, small pills.

const MatchPill = ({ match }: { match: VerifiedContractMinimal["match"] }) => {
  const isExact = match === "exact_match";
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
      {isExact ? <IoCheckmarkDoneCircle className="h-4 w-4" aria-hidden="true" /> : <IoCheckmarkCircle className="h-4 w-4" aria-hidden="true" />}
      {isExact ? (
        <>
          Exact<span className="hidden sm:inline"> Match</span>
        </>
      ) : (
        "Match"
      )}
    </span>
  );
};

// A box for "nothing found": a red cross, a bold line and one explaining line
const EmptyState = ({ title, text }: { title: string; text: ReactNode }) => (
  <div className="rounded-md border border-gray-200 bg-white p-4 text-left">
    <div className="flex items-center gap-3">
      <IoCloseCircle className="h-8 w-8 shrink-0 text-red-500" aria-hidden="true" />
      <div>
        <p className="text-base font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{text}</p>
      </div>
    </div>
  </div>
);

// One row per chain: name, chain ID, match pill and an arrow. Opens the contract on repo.sourcify.dev.
const ChainRow = ({ contract, showAddress = false }: { contract: VerifiedContractMinimal; showAddress?: boolean }) => {
  const { sourcifyChainMap } = useContext(Context);
  const chain = sourcifyChainMap[parseInt(contract.chainId)];
  const deprecated = chain ? !chain.supported : false;
  return (
    <li>
      <a
        href={`${REPOSITORY_URL}/${contract.chainId}/${contract.address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 hover:bg-ceruleanBlue-100 focus:bg-ceruleanBlue-100 focus:outline-none sm:gap-3"
      >
        <div className={`min-w-0 flex-1 ${deprecated ? "opacity-50" : ""}`}>
          <div className="flex items-center gap-2">
            <span className="break-words text-sm font-medium text-gray-900">{chain?.name ?? `Chain ${contract.chainId}`}</span>
            {deprecated && (
              <span className="shrink-0 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-600">
                deprecated
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Chain ID: <span className="font-mono">{contract.chainId}</span>
            {showAddress && (
              <>
                {" · "}
                <span className="break-all font-mono">{contract.address}</span>
              </>
            )}
          </div>
        </div>
        <div className={`shrink-0 ${deprecated ? "opacity-50" : ""}`}>
          <MatchPill match={contract.match} />
        </div>
        <IoChevronForward className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
      </a>
    </li>
  );
};

// Show the chain filter only when the list is long enough to need it
const CHAIN_FILTER_THRESHOLD = 8;

const ContractResult = ({ contracts }: { contracts: VerifiedContractMinimal[] }) => {
  const { sourcifyChains, sourcifyChainMap } = useContext(Context);
  const [filter, setFilter] = useState("");
  if (contracts.length === 0) {
    return <EmptyState title="Not verified" text="This address is not verified on Sourcify on any chain." />;
  }
  // The order of Sourcify's /chains list (Ethereum first); chains missing from it go last
  const position = new Map(sourcifyChains.map((chain, index) => [String(chain.chainId), index]));
  const sorted = [...contracts].sort(
    (a, b) =>
      (position.get(a.chainId) ?? Infinity) - (position.get(b.chainId) ?? Infinity) || Number(a.chainId) - Number(b.chainId),
  );
  const q = filter.trim().toLowerCase();
  const visible = q
    ? sorted.filter((c) => c.chainId.includes(q) || sourcifyChainMap[parseInt(c.chainId)]?.name.toLowerCase().includes(q))
    : sorted;
  return (
    <div>
      <div className="mb-2 flex min-h-9 items-center justify-between gap-3">
        {contracts.length > CHAIN_FILTER_THRESHOLD && (
          <input
            type="text"
            aria-label="Filter chains"
            placeholder="Filter chains…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ceruleanBlue-500 sm:w-56 sm:flex-none"
          />
        )}
        <p className="ml-auto shrink-0 whitespace-nowrap text-sm text-gray-700">
          Verified on <span className="font-semibold">{contracts.length}</span> {contracts.length === 1 ? "chain" : "chains"}
        </p>
      </div>
      <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200 bg-white">
        {visible.map((c) => (
          <ChainRow key={`${c.chainId}-${c.matchId}`} contract={c} />
        ))}
        {visible.length === 0 && <li className="px-3 py-2.5 text-sm text-gray-500">No chains match “{filter}”.</li>}
      </ul>
    </div>
  );
};

const FooterLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-ceruleanBlue-600 hover:underline">
    {children} →
  </a>
);

const SignatureResult = ({ kind, query, signatures }: { kind: Kind; query: string; signatures: SignatureGroup[] }) => {
  if (signatures.length === 0) {
    const what = kind === "name" ? "signature with this name" : kind === "signature" ? "entry for this signature" : "name for this hash";
    return <EmptyState title="No signature found" text={`The 4byte database has no ${what}.`} />;
  }
  const rows = signatures.flatMap(({ hash, items, type }) => items.map((s) => ({ hash, type, ...s })));
  return (
    <div>
      <div className="mb-2 flex min-h-9 items-center justify-between gap-3">
        <p className="text-sm text-gray-700">From the 4byte database</p>
        <p className="shrink-0 whitespace-nowrap text-sm text-gray-700">
          <span className="font-semibold">{rows.length}</span> {rows.length === 1 ? "signature" : "signatures"}
        </p>
      </div>
      <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200 bg-white">
        {rows.map((row) => (
          <li key={row.hash + row.name} className="flex items-center gap-2 px-3 py-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <div className="break-all font-mono text-sm font-medium text-gray-900">{row.name}</div>
              <div className="text-xs text-gray-500">
                {row.type}: <span className="font-mono">{short(row.hash)}</span>
              </div>
            </div>
            {row.hasVerifiedContract && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                <IoCheckmarkCircle className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">In verified contracts</span>
                <span className="sm:hidden">Verified</span>
              </span>
            )}
          </li>
        ))}
      </ul>
      {/* The 4byte site runs the search in its "q" parameter when the page loads */}
      <FooterLink href={`https://${FOURBYTE_HOST}/?q=${encodeURIComponent(query)}`}>See all results on {FOURBYTE_HOST}</FooterLink>
    </div>
  );
};

const isGroup = (f: DisplayField | DisplayFieldGroup): f is DisplayFieldGroup => "fields" in f;

// Clear signing rows: the label on the left, the value on the right, as in the Clear Signing card
const FieldRows = ({ fields }: { fields: DisplayField[] }) => (
  <>
    {fields.map((f, i) => (
      <div key={f.label + i} className="flex items-baseline justify-between gap-3 py-2">
        <dt className="shrink-0 text-gray-500">{f.separator ? `${f.separator} · ${f.label}` : f.label}</dt>
        <dd className="min-w-0 break-all text-right font-mono text-gray-900">{f.value}</dd>
      </div>
    ))}
  </>
);

const Pill = ({ className, children }: { className: string; children: ReactNode }) => (
  <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{children}</span>
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
    return <EmptyState title="Contract creation" text="This transaction creates a contract, so there is no call to show in plain words." />;
  }

  return (
    <div>
      <p className="mb-2 flex min-h-9 flex-wrap items-center gap-x-1.5 text-sm text-gray-700">
        <span>
          Ethereum transaction <span className="font-mono">{short(tx.hash)}</span>
        </span>
        <span className="min-w-0">
          to contract{" "}
          <a
            href={`${REPOSITORY_URL}/1/${tx.to}`}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-mono text-ceruleanBlue-600 hover:underline"
          >
            {tx.to}
          </a>
        </span>
      </p>

      {/* The layout of the Clear Signing card: blind signing (faded) on the left, an arrow, clear signing on the right.
          On phones the parts stack and the arrow points down. */}
      <div className="grid grid-cols-1 overflow-hidden rounded-md border border-gray-200 bg-white md:grid-cols-[1fr_auto_1fr]">
        {/* The clear signing side sets the height; the calldata is cut off below it and fades out */}
        <div className="relative min-h-[8rem] md:min-h-0">
          <div className="absolute inset-0 flex flex-col gap-2 overflow-hidden p-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Pill className="bg-gray-100 text-gray-500">Blind signing</Pill>
              <span className="text-xs text-gray-400">What a wallet without clear signing shows</span>
            </div>
            <code className="block break-all font-mono text-[11px] leading-relaxed text-gray-400">{calldata}</code>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" aria-hidden="true" />
        </div>

        <div className="relative flex items-center justify-center py-1 md:px-1 md:py-0">
          <div className="absolute inset-x-0 h-px bg-gray-200 md:inset-x-auto md:inset-y-0 md:h-auto md:w-px" aria-hidden="true" />
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-xs text-gray-500">
            <FaArrowRight className="rotate-90 md:rotate-0" aria-hidden="true" />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2 p-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Pill className="bg-ceruleanBlue-500 text-white">Clear signing</Pill>
            <span className="text-xs text-gray-500">What a wallet shows with clear signing</span>
          </div>
          {hasDescriptor ? (
            <>
              {/* The intent stays the most prominent line, labeled "Action" like in the Clear Signing card */}
              {intent && (
                <div className="flex items-baseline justify-between gap-3 rounded-md bg-ceruleanBlue-50 px-3 py-2">
                  <span className="shrink-0 text-sm text-gray-600">Action</span>
                  <span className="min-w-0 break-words text-right text-lg font-semibold text-gray-900">
                    {intent.charAt(0).toUpperCase() + intent.slice(1)}
                  </span>
                </div>
              )}
              {display?.interpolatedIntent && <p className="text-sm text-gray-600">{display.interpolatedIntent}</p>}
              <dl className="divide-y divide-gray-100 text-sm">
                {(display?.fields ?? []).map((f, i) =>
                  isGroup(f) ? (
                    <div key={i}>
                      {f.label && <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{f.label}</p>}
                      <FieldRows fields={f.fields} />
                    </div>
                  ) : (
                    <FieldRows key={i} fields={[f]} />
                  ),
                )}
              </dl>
              {display?.metadata?.contractName && (
                <p className="text-xs text-gray-500">
                  {display.metadata.contractName}
                  {display.metadata.owner ? ` by ${display.metadata.owner}` : ""}
                </p>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-700">
              <p>No ERC-7730 descriptor for this contract yet, so wallets cannot show this call in plain words.</p>
              {functionNames.length > 0 && (
                <p className="mt-1">
                  From 4byte, the function is <span className="font-mono font-medium text-gray-900">{functionNames[0]}</span>.
                </p>
              )}
              <FooterLink href={REGISTRY_URL}>Add a descriptor to the registry</FooterLink>
            </div>
          )}
        </div>
      </div>

      {/* The same transaction, one layer down: the contract it calls */}
      <p className="mb-2 mt-3 text-sm text-gray-700">Contract source</p>
      {contract ? (
        <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 bg-white">
          <ChainRow contract={contract} showAddress />
        </ul>
      ) : (
        <EmptyState title="Not verified" text={`The contract ${tx.to} is not verified on Sourcify.`} />
      )}
      <FooterLink href={CLEAR_SIGNING_PLAYGROUND_URL}>Open the Clear Signing playground</FooterLink>
    </div>
  );
};

const HeroReadable = () => {
  const { sourcifyChains } = useContext(Context);
  const live = useLiveStats(true);
  const [signatureCount, setSignatureCount] = useState<number | null>(null);
  // The daily stats.json total, used until the live total arrives (the same fallback as the stats section)
  const [dailyTotal, setDailyTotal] = useState<number | null>(null);
  // The live size of the public Postgres database, from the daily export stats (the same file as the stats section)
  const [databaseBytes, setDatabaseBytes] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [result, setResultState] = useState<Result>({ status: "idle" });

  useEffect(() => {
    fetch(`${FOURBYTE_API}/stats`)
      .then((r) => r.json())
      .then((json) => setSignatureCount(json.result?.count?.total ?? null))
      .catch(() => setSignatureCount(null));
    fetch(`https://${IS_STAGING ? "staging." : ""}sourcify.dev/static/stats.json`)
      .then((r) => r.json())
      .then((stats: Record<string, { full_match: number; partial_match: number }>) =>
        setDailyTotal(Object.values(stats).reduce((sum, s) => sum + s.full_match + s.partial_match, 0)),
      )
      .catch(() => setDailyTotal(null));
    fetch(`https://export.${IS_STAGING ? "staging." : ""}sourcify.dev/v2/stats.json`)
      .then((r) => r.json())
      .then((stats: { database?: { totalBytes?: number } }) => setDatabaseBytes(stats.database?.totalBytes ?? null))
      .catch(() => setDatabaseBytes(null));
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
    databaseBytes !== null && { value: formatSize(databaseBytes), label: "public database" },
  ].filter(Boolean) as { value: string; label: string }[];

  let resultBody: ReactNode = null;
  switch (result.status) {
    case "loading":
      resultBody = (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-ceruleanBlue-300 border-t-ceruleanBlue-600" />
          Looking up {short(result.query)}…
        </div>
      );
      break;
    case "invalid":
      resultBody = (
        <p className="text-sm text-gray-700">
          Sourcify cannot read <span className="font-mono">{short(result.query)}</span>. Paste a contract address (0x and 40
          hex characters), a transaction hash or event topic (0x and 64), a selector (0x and 8), a signature like{" "}
          <span className="font-mono">transfer(address,uint256)</span>, or a function name.
        </p>
      );
      break;
    case "error":
      resultBody = (
        <p className="text-sm text-red-600">
          Could not look up {short(result.query)}.{" "}
          <button type="button" onClick={() => lookUp(result.query)} className="cursor-pointer underline">
            Try again
          </button>
        </p>
      );
      break;
    case "not-found":
      resultBody = (
        <EmptyState
          title="Not found"
          text="No Ethereum transaction and no event topic has this hash. Transactions are looked up on Ethereum mainnet only."
        />
      );
      break;
    case "contract":
      resultBody = <ContractResult key={result.query} contracts={result.contracts} />;
      break;
    case "signatures":
      resultBody = <SignatureResult kind={result.kind} query={result.query} signatures={result.signatures} />;
      break;
    case "transaction":
      resultBody = <TransactionResult result={result} />;
      break;
  }

  return (
    // Full screen height, like the original hero: -mt-20 pt-20 lets the section start under the header
    <section className="min-h-screen -mt-20 pt-20 flex flex-col items-center justify-center px-4 md:px-8 pb-12 text-center">
      {/* 66rem: room for the lookup area on large screens; the headline and subline set their own widths */}
      <div className="flex w-full max-w-5xl flex-col items-center">
        <h1
          className="text-5xl md:text-7xl font-bold tracking-tight text-gray-800 opacity-0 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          Make Ethereum{" "}
          <span className="text-ceruleanBlue-500">
            <ReadableWord />
          </span>
          .
        </h1>
        <p
          className="mt-4 max-w-2xl text-lg md:text-xl text-gray-600 opacity-0 animate-fade-up"
          style={{ animationDelay: "250ms" }}
        >
          Sourcify matches EVM contracts to their source code and turns bytecode into human-readable information.
          <span className="mt-2 block font-semibold text-gray-700">Open source. Open data.</span>
        </p>

        {/* relative z-20: the result overlay must show above the links, numbers and sections that follow */}
        <div
          className="relative z-20 mt-8 w-full max-w-[50rem] lg:max-w-5xl opacity-0 animate-fade-up"
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
            {/* Clear: empties the box and closes the result */}
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  closeResult();
                }}
                aria-label="Clear"
                className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceruleanBlue-500"
              >
                <FiX className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
            <button
              type="submit"
              aria-label="Look up"
              title="Look up"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ceruleanBlue-500 text-white hover:bg-ceruleanBlue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceruleanBlue-300"
            >
              <FiArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>

          {result.status !== "idle" && (
            <div
              role="dialog"
              aria-label="Lookup result"
              className="absolute inset-x-0 top-full z-30 mt-2 max-h-[min(70vh,44rem)] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2 text-left shadow-xl sm:p-3"
            >
              <div aria-live="polite">{resultBody}</div>
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

        {/* Proof row: live numbers, each shown only once it has loaded */}
        <dl
          className="mt-6 md:mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 opacity-0 animate-fade-up"
          style={{ animationDelay: "550ms" }}
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

        <div
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-base opacity-0 animate-fade-up"
          style={{ animationDelay: "700ms" }}
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
      </div>
    </section>
  );
};

export default HeroReadable;
