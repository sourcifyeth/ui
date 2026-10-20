import { FormEvent, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCheck, FiSearch } from "react-icons/fi";
import { id as keccakOfText } from "@ethersproject/hash";
import MatchBadge from "../../components/MatchBadge";
import { Context } from "../../Context";
import { REPOSITORY_URL } from "../../constants";
import { getVerifiedContractAllChains } from "../../utils/api";
import { VerifiedContractMinimal } from "../../types";
import useLiveStats from "./useLiveStats";

// Hero variant D: "Make Ethereum readable." with one lookup box for addresses, selectors, topics and names.

const FOURBYTE_API = "https://api.4byte.sourcify.dev/signature-database/v1";
// Chains shown in the address result before "more chains"
const MAX_CHAINS = 4;
// Signatures shown in a 4byte result
const MAX_SIGNATURES = 5;

// The hero is shorter than the screen, so the tabs and the top of the cards show at the bottom of the first screen.
// 336px = header (about 112px) + tabs (about 64px) + the part of the cards that shows (about 160px).
const HERO_MIN_HEIGHT = "min-h-[calc(100svh-336px)]";

type Kind = "address" | "selector" | "topic" | "signature" | "name";

type Signature = { name: string; hasVerifiedContract: boolean };

type Result =
  | { status: "idle" }
  | { status: "loading"; kind: Kind; query: string }
  | { status: "invalid"; query: string }
  | { status: "error"; kind: Kind; query: string }
  | { status: "contract"; query: string; contracts: VerifiedContractMinimal[] }
  | { status: "signatures"; kind: Kind; query: string; signatures: SignatureGroup[] };

type SignatureGroup = { hash: string; items: Signature[]; type: string };

const EXAMPLES: { label: string; value: string }[] = [
  { label: "Contract", value: "0x1F98431c8aD98523631AE4a59f267346ea31F984" },
  { label: "Function", value: "0xa9059cbb" },
  { label: "Event", value: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" },
  { label: "Signature", value: "transfer(address,uint256)" },
];

// Reads what was pasted: a 20-byte address, a 4-byte selector, a 32-byte topic,
// a full signature like transfer(address,uint256), or a bare name to search for
const kindOf = (query: string): Kind | null => {
  if (/^0x[0-9a-fA-F]{40}$/.test(query)) return "address";
  if (/^0x[0-9a-fA-F]{8}$/.test(query)) return "selector";
  if (/^0x[0-9a-fA-F]{64}$/.test(query)) return "topic";
  if (/^0x/i.test(query)) return null;
  if (/^[A-Za-z_$][A-Za-z0-9_$]*\(.*\)$/.test(query)) return "signature";
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(query)) return "name";
  return null;
};

// Shortens long hex values only; names and signatures stay as they are
const short = (value: string) => (/^0x/i.test(value) && value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value);

const formatCompact = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n);

async function lookUpSignatures(kind: Kind, query: string) {
  let url: string;
  if (kind === "signature") {
    // A full signature: its keccak256 is the event topic, and the first 4 bytes are the function or error selector
    const topic = keccakOfText(query.replace(/\s+/g, ""));
    url = `${FOURBYTE_API}/lookup?function=${topic.slice(0, 10)}&event=${topic}`;
  } else if (kind === "name") {
    // The "(" keeps the search to this exact name with any arguments
    url = `${FOURBYTE_API}/search?query=${encodeURIComponent(`${query}(`)}*`;
  } else {
    url = `${FOURBYTE_API}/lookup?${kind === "topic" ? "event" : "function"}=${query}`;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`4byte lookup failed: ${response.status}`);
  const json = await response.json();
  // A 4-byte hash is a function or an error selector; a 32-byte hash is an event topic
  const groups = [
    ...Object.entries((json.result?.function ?? {}) as Record<string, Signature[]>).map(([hash, items]) => ({ hash, items, type: "Function" })),
    ...Object.entries((json.result?.event ?? {}) as Record<string, Signature[]>).map(([hash, items]) => ({ hash, items, type: "Event" })),
  ];
  return groups
    .filter(({ items }) => items.length > 0)
    // Signatures used in a verified contract first
    .sort((a, b) => Number(b.items.some((s) => s.hasVerifiedContract)) - Number(a.items.some((s) => s.hasVerifiedContract)))
    .slice(0, MAX_SIGNATURES);
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
        {shown.map((c) => {
          const chain = sourcifyChainMap[parseInt(c.chainId)];
          return (
            <li key={c.chainId} className="flex items-center gap-3 py-2">
              <span className="min-w-0 flex-1 truncate text-gray-800">{chain?.title || chain?.name || `Chain ${c.chainId}`}</span>
              <MatchBadge match={c.match} small />
              <a
                href={`${REPOSITORY_URL}/${c.chainId}/${c.address}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ceruleanBlue-500 font-medium link-underline whitespace-nowrap"
              >
                {/* Short label on phones, so the chain name keeps its room */}
                <span className="hidden sm:inline">Read the source</span>
                <span className="sm:hidden">Source</span>
              </a>
            </li>
          );
        })}
      </ul>
      {contracts.length > shown.length && (
        <Link to={`/address/${query}`} className="self-start text-sm text-ceruleanBlue-500 font-medium link-underline">
          See all {contracts.length} chains
        </Link>
      )}
    </div>
  );
};

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
        {kind === "topic"
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

const HeroReadable = () => {
  const { sourcifyChains } = useContext(Context);
  const live = useLiveStats(true);
  const [signatureCount, setSignatureCount] = useState<number | null>(null);
  // The daily stats.json total, used until the live total arrives (the same fallback as the stats section)
  const [dailyTotal, setDailyTotal] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Result>({ status: "idle" });

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

  const lookUp = async (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    const kind = kindOf(q);
    if (!kind) {
      setResult({ status: "invalid", query: q });
      return;
    }
    setResult({ status: "loading", kind, query: q });
    try {
      if (kind === "address") {
        const response = await getVerifiedContractAllChains(q);
        setResult({ status: "contract", query: q, contracts: response.results });
      } else {
        setResult({ status: "signatures", kind, query: q, signatures: await lookUpSignatures(kind, q) });
      }
    } catch {
      setResult({ status: "error", kind, query: q });
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

  return (
    <section className={`${HERO_MIN_HEIGHT} flex flex-col items-center justify-center px-4 py-6 md:py-8 text-center`}>
      <div className="flex w-full max-w-4xl flex-col items-center">
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
          Sourcify matches deployed contracts to their source code, byte for byte, and turns them into names, data and
          clear transactions that anyone can read. Open source, open data.
        </p>

        {/* Lookup: one box for addresses, selectors, topics and names */}
        {/* 50rem: wide enough for the four example chips in one row on desktop */}
        <div className="mt-8 w-full max-w-[50rem] opacity-0 animate-fade-up" style={{ animationDelay: "400ms" }}>
          <form
            onSubmit={onSubmit}
            role="search"
            aria-label="Look up a contract or signature"
            className="flex items-center gap-2 rounded-2xl bg-white p-2 pl-4 shadow-lg ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-ceruleanBlue-500"
          >
            <FiSearch className="shrink-0 text-gray-400" aria-hidden="true" />
            <label htmlFor="hero-lookup" className="sr-only">
              Contract address, selector, topic or name
            </label>
            <input
              id="hero-lookup"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Paste an address, selector or topic"
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

          {/* Example chips: each fills the box and runs the lookup */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-gray-500">Try:</span>
            {EXAMPLES.map(({ label, value }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setQuery(value);
                  lookUp(value);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 ring-1 ring-gray-200 hover:ring-ceruleanBlue-500"
              >
                <span className="font-medium text-gray-700">{label}</span>
                {/* Values only from tablet width up, so the chips fit on a phone */}
                <code className="hidden sm:inline font-mono text-xs text-gray-500">{short(value)}</code>
              </button>
            ))}
          </div>

          {result.status !== "idle" && (
            <div className="mt-4 rounded-2xl bg-white p-4 md:p-5 text-left shadow-sm ring-1 ring-gray-200" aria-live="polite">
              {result.status === "loading" && <p className="text-gray-500">Looking up {short(result.query)}…</p>}
              {result.status === "invalid" && (
                <p className="text-gray-700">
                  Sourcify cannot read <code className="font-mono">{short(result.query)}</code>. Paste a contract address (0x and 40
                  hex characters), a selector (0x and 8), an event topic (0x and 64), a signature like{" "}
                  <code className="font-mono">transfer(address,uint256)</code>, or a function name.
                </p>
              )}
              {result.status === "error" && (
                <p className="text-gray-700">The lookup did not work. Check your connection and try again.</p>
              )}
              {result.status === "contract" && <ContractResult query={result.query} contracts={result.contracts} />}
              {result.status === "signatures" && <SignatureResult kind={result.kind} signatures={result.signatures} />}
            </div>
          )}
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
