import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../Button";
import { bigquery, BigQueryResponse } from "../../utils/api";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import "./styles.css";

const DEFAULT_SQL = `-- Example: Latest verified contract's chain and address
SELECT chain_id, address
FROM sourcify_staging.public_verified_contracts vc
JOIN sourcify_staging.public_contract_deployments cd ON vc.deployment_id = cd.id
ORDER BY vc.created_at DESC
LIMIT 1;`;

// Minimal BigQuery schema context for better SQL generation
const SCHEMA_DOC = `
You are writing SQL for BigQuery (Standard SQL) against dataset sourcify_staging.
All tables are prefixed with public_. Only use these tables/columns and relationships:

- public_code (code_hash BYTEA PRIMARY KEY, code_hash_keccak BYTEA, code BYTEA)

- public_contracts (
  id UUID PRIMARY KEY,
  creation_code_hash BYTEA REFERENCES public_code(code_hash),
  runtime_code_hash BYTEA REFERENCES public_code(code_hash)
)

- public_compiled_contracts (
  id UUID PRIMARY KEY,
  compiler TEXT, version TEXT, language TEXT,
  name TEXT, fully_qualified_name TEXT,
  compiler_settings JSONB, compilation_artifacts JSONB,
  creation_code_hash BYTEA REFERENCES public_code(code_hash),
  creation_code_artifacts JSONB,
  runtime_code_hash BYTEA REFERENCES public_code(code_hash),
  runtime_code_artifacts JSONB
)

- public_compiled_contracts_sources (
  id UUID PRIMARY KEY,
  compilation_id UUID REFERENCES public_compiled_contracts(id),
  source_hash BYTEA REFERENCES public_sources(source_hash),
  path TEXT
)

- public_sources (
  source_hash BYTEA PRIMARY KEY,
  source_hash_keccak BYTEA,
  content TEXT
)

- public_contract_deployments (
  id UUID PRIMARY KEY,
  chain_id BIGINT,
  address BYTEA,
  transaction_hash BYTEA,
  block_number NUMERIC,
  transaction_index NUMERIC,
  deployer BYTEA,
  contract_id UUID REFERENCES public_contracts(id)
)

- public_verified_contracts (
  id BIGINT PRIMARY KEY,
  deployment_id UUID REFERENCES public_contract_deployments(id),
  compilation_id UUID REFERENCES public_compiled_contracts(id),
  creation_match BOOLEAN, creation_values JSONB, creation_transformations JSONB, creation_metadata_match BOOLEAN,
  runtime_match BOOLEAN, runtime_values JSONB, runtime_transformations JSONB, runtime_metadata_match BOOLEAN,
  created_at TIMESTAMP, updated_at TIMESTAMP
)

Foreign keys:
- compiled_contracts.creation_code_hash -> code.code_hash
- compiled_contracts.runtime_code_hash -> code.code_hash
- contracts.creation_code_hash -> code.code_hash
- contracts.runtime_code_hash -> code.code_hash
- compiled_contracts_sources.compilation_id -> compiled_contracts.id
- compiled_contracts_sources.source_hash -> sources.source_hash
- contract_deployments.contract_id -> contracts.id
- verified_contracts.deployment_id -> contract_deployments.id
- verified_contracts.compilation_id -> compiled_contracts.id

Conventions:
- Addresses and hashes are stored as BYTEA; for display, hex-encode as needed.
- Only in FROM and JOIN clauses, use full table names (e.g., sourcify_staging.public_contracts).
- Prefer using verified_contracts joined with contract_deployments for chain_id/address queries.
- Unless specified, include an explicit LIMIT 10.
`;

type RowObject = Record<string, unknown> | unknown[] | null | undefined;

function parseRowValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ((value as any).type === "Buffer" && Array.isArray((value as any).data)) {
      // Special case for Buffer objects
      return `0x${(value as any).data.map((b: number) => b.toString(16).padStart(2, "0")).join("")}`;
    }
    return JSON.stringify(value);
  };
  return String(value);
}

const BigQueryExplorer = () => {
  const [sql, setSql] = useState<string>(DEFAULT_SQL);
  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [bqError, setBqError] = useState<string | null>(null);
  const [result, setResult] = useState<BigQueryResponse | null>(null);
  const [nlPrompt, setNlPrompt] = useState<string>(
    "Show the latest 10 verified contracts with address and chainId."
  );
  const [generating, setGenerating] = useState(false);
  const [model, setModel] = useState<string>(
    "deepseek/deepseek-chat-v3.1:free"
  );
  const [validatingModel, setValidatingModel] = useState(false);
  const [modelValid, setModelValid] = useState<boolean | null>(null);
  const [modelValidationMsg, setModelValidationMsg] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");

  // Line numbers gutter scroll sync
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  const lineCount = useMemo(() => (sql ? sql.split("\n").length : 1), [sql]);

  useEffect(() => {
    const onScroll = () => {
      if (!textareaRef.current || !gutterRef.current) return;
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    };
    const ta = textareaRef.current;
    ta?.addEventListener("scroll", onScroll);
    return () => ta?.removeEventListener("scroll", onScroll);
  }, []);

  // Debounced model validation against OpenRouter API
  useEffect(() => {
    let active = true;
    if (!model?.trim()) {
      setModelValid(null);
      setModelValidationMsg("");
      return;
    }
    const trimmed = model.trim();
    // If using the app key (built-in), only allow :free models
    if ((process.env.REACT_APP_OPENROUTER_API_KEY || process.env.REACT_APP_OPENROUTER_KEY) && !apiKey) {
      if (!trimmed.endsWith(":free")) {
        setModelValid(false);
        setModelValidationMsg("Only free models are supported with the built-in key (suffix :free)");
        return;
      }
    }
    setValidatingModel(true);
    setModelValidationMsg("");
    const slug = trimmed.split(":")[0];
    const timer = setTimeout(async () => {
      try {
        const usedKey = (apiKey || process.env.REACT_APP_OPENROUTER_API_KEY || process.env.REACT_APP_OPENROUTER_KEY || "").trim();
        if (!usedKey) {
          setModelValid(null);
          setModelValidationMsg("");
          return;
        }
        const res = await fetch(`https://openrouter.ai/api/v1/models/${slug}/endpoints`, {
          headers: {
            Authorization: `Bearer ${usedKey}`,
          },
        });
        if (!active) return;
        if (!res.ok) {
          setModelValid(false);
          setModelValidationMsg(`Model not found or unauthorized (${res.status})`);
        } else {
          const data = await res.json().catch(() => null);
          const ok = data && (Array.isArray(data) ? data.length > 0 : true);
          setModelValid(!!ok);
          if (!ok) setModelValidationMsg("No endpoints available for this model");
        }
      } catch (e: any) {
        if (!active) return;
        setModelValid(false);
        setModelValidationMsg("Failed to validate model");
      } finally {
        if (active) setValidatingModel(false);
      }
    }, 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [apiKey, model]);

  const handleExecute = async () => {
    setLoading(true);
    setBqError(null);
    try {
      const res = await bigquery(sql);
      setResult(res);
    } catch (e: any) {
      setResult(null);
      setBqError(e?.message || "Failed to run query");
    } finally {
      setLoading(false);
    }
  };

  // Initialize user-provided API key from localStorage only (keep empty by default)
  useEffect(() => {
    let fromStorage = "";
    try {
      fromStorage = window.localStorage.getItem("openrouter_api_key") || "";
    } catch {}
    const initial = (fromStorage || "").trim();
    if (initial) setApiKey(initial);
  }, []);

  // Persist key locally for convenience
  useEffect(() => {
    try {
      if (apiKey) window.localStorage.setItem("openrouter_api_key", apiKey);
      else window.localStorage.removeItem("openrouter_api_key");
    } catch {}
  }, [apiKey]);

  // Determine effective API key: prefer user key; fallback to app key from env
  const effectiveApiKey = useMemo(() => {
    return (apiKey || process.env.REACT_APP_OPENROUTER_API_KEY || process.env.REACT_APP_OPENROUTER_KEY || "").trim();
  }, [apiKey]);

  const openrouter = useMemo(() => {
    if (!effectiveApiKey) return null;
    return createOpenRouter({ apiKey: effectiveApiKey });
  }, [effectiveApiKey]);

  const handleGenerate = async () => {
    if (!openrouter) {
      setGenError(
        "OpenRouter key missing. Add your key to use any model, or configure REACT_APP_OPENROUTER_API_KEY for free models."
      );
      return;
    }
    setGenerating(true);
    setGenError(null);
    try {
      const chosenModel = model;
      // Runtime enforcement for built-in key
      const usingAppKey = !apiKey && (process.env.REACT_APP_OPENROUTER_API_KEY || process.env.REACT_APP_OPENROUTER_KEY);
      if (usingAppKey && !chosenModel.trim().endsWith(":free")) {
        throw new Error("Only :free models are supported with the built-in key");
      }
      const system = `You are a SQL assistant for Google BigQuery (Standard SQL).\n` +
        `- Output ONLY executable SQL. No markdown, no commentary.\n` +
        `- Prefer SELECT queries; avoid DDL/DML.\n` +
        `- Ensure syntax is valid for BigQuery Standard SQL.\n\n` +
        SCHEMA_DOC;
      const prompt = `User request: ${nlPrompt}\n` +
        `Return only the SQL statement that fulfills it.`;

      const { text } = await generateText({
        model: openrouter.chat(chosenModel),
        system,
        prompt,
        maxTokens: 800,
      });
      const cleaned = text
        .replace(/```sql/gi, "")
        .replace(/```/g, "")
        .trim();
      if (!cleaned) throw new Error("Model returned an empty response");
      setSql(cleaned);
    } catch (e: any) {
      try {
        setGenError("Openrouter error: " + JSON.parse(e.responseBody).error.message);
      }catch{
        setGenError("Unkown error generating SQL");
      }
    } finally {
      setGenerating(false);
    }
  };

  const columns: string[] = useMemo(() => {
    const rows = result?.rows || [];
    if (!rows.length) return [];
    const first = rows[0] as RowObject;
    if (Array.isArray(first)) {
      return first.map((_, i) => String(i));
    }
    if (first && typeof first === "object") {
      // Collect union of keys across rows to avoid missing sparse columns
      const set = new Set<string>();
      for (const r of rows) {
        if (r && typeof r === "object" && !Array.isArray(r)) {
          Object.keys(r as Record<string, unknown>).forEach((k) => set.add(k));
        }
      }
      return Array.from(set);
    }
    return [];
  }, [result]);

  const formatNumber = (n?: number) =>
    typeof n === "number" && Number.isFinite(n) ? n.toFixed(2) : "-";

  return (
    <section className="px-8 md:px-12 lg:px-24 bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">BigQuery Explorer</h2>
        <p className="text-gray-600 mb-6">
          Write a SQL query and execute it against the dataset. Results show below.
        </p>

        {/* AI Generator */}
        <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
          <div className="p-4">
            <label className="block text-sm text-gray-600 mb-2">Describe your query</label>
            <textarea
              value={nlPrompt}
              onChange={(e) => setNlPrompt(e.target.value)}
              placeholder="e.g., List top 10 contracts by verification date"
              rows={4}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ceruleanBlue-300 resize-y"
            />

            <div className="mt-3 flex flex-col sm:flex-row gap-2 md:gap-3 items-stretch">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm text-gray-600">Model</label>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="author/slug:free (e.g., meta-llama/llama-3.1-8b-instruct:free)"
                  className="border border-gray-200 rounded-md px-2 py-2 text-sm w-full"
                />
                {validatingModel && (
                  <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                )}
                {modelValid === true && !validatingModel && (
                  <span className="text-green-600 text-xs">Valid</span>
                )}
                {modelValid === false && !validatingModel && (
                  <span className="text-red-600 text-xs" title={modelValidationMsg}>Invalid</span>
                )}
              </div>

              <div className="flex-1 flex items-center gap-2 sm:justify-end">
                <label className="text-sm text-gray-600 shrink-0">OpenRouter key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-..."
                  className="border border-gray-200 rounded-md px-2 py-2 text-sm w-full sm:w-72"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <Button onClick={handleGenerate} className="uppercase" disabled={generating || modelValid !== true}>
                {generating ? "Generating…" : "Generate SQL"}
              </Button>
              <div className="text-xs text-gray-500">
                {apiKey ? "Using your OpenRouter key: all models supported." : "Using built-in key: only free models supported."}
              </div>
            </div>
          </div>
          {!apiKey && !(process.env.REACT_APP_OPENROUTER_API_KEY || process.env.REACT_APP_OPENROUTER_KEY) && (
            <div className="px-4 py-3 bg-yellow-50 text-yellow-800 border-t border-yellow-200 text-sm">
              Enter your OpenRouter API key above to enable all models, or configure REACT_APP_OPENROUTER_API_KEY to use free models without entering a key.
            </div>
          )}
          {genError && (
            <div className="px-4 py-3 bg-red-50 text-red-700 border-t border-red-200 text-sm">
              {genError}
            </div>
          )}
        </div>

        {/* Editor Card */}
        <div className="bg-white rounded-xl shadow overflow-hidden mb-8">
          <div className="border-b border-gray-200 p-4 flex items-center justify-between gap-4">
            <span className="text-sm text-gray-600">SQL Editor</span>
            <div className="flex items-center gap-2">
              <Button onClick={handleExecute} className="uppercase" disabled={generating || loading}>
                {loading ? "Executing..." : "Execute"}
              </Button>
            </div>
          </div>

          <div className="relative flex w-full" style={{ height: 260 }}>
            {/* Gutter */}
            <div
              ref={gutterRef}
              className="select-none text-right text-xs leading-6 px-3 py-3 bg-[#0f172a] text-gray-400 border-r border-gray-700 gutter-scrollbar"
              style={{ width: 44, overflow: "hidden auto" }}
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              spellCheck={false}
              disabled={generating}
              aria-disabled={generating}
              className="flex-1 text-sm leading-6 p-3 font-mono bg-[#111827] text-gray-100 outline-none resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                tabSize: 2,
                MozTabSize: 2 as unknown as number,
                overflow: "auto",
              }}
              placeholder="Write your SQL here..."
            />
            {generating && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Generating">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="border-b border-gray-200 p-4">
            <h3 className="font-semibold">Results</h3>
            <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-4">
              <div>
                <span className="text-gray-500">Rows:</span> {result?.rowCount ?? 0}
              </div>
              <div>
                <span className="text-gray-500">Billed MiB:</span> {formatNumber(result?.billedMiB)}
              </div>
              <div>
                <span className="text-gray-500">Estimated MiB:</span> {formatNumber(result?.estimatedMiB)}
              </div>
              {result?.jobId && (
                <div className="truncate max-w-full">
                  <span className="text-gray-500">Job ID:</span> <span className="font-mono">{result.jobId}</span>
                </div>
              )}
            </div>
          </div>

          {bqError && (
            <div className="px-4 py-3 bg-red-50 text-red-700 border-t border-red-200 text-sm">
              {bqError}
            </div>
          )}

          {loading && (
            <div className="p-6 text-sm text-gray-600">Running query...</div>
          )}

          {!loading && result && (result.rows?.length ?? 0) === 0 && (
            <div className="p-6 text-sm text-gray-600">No rows returned.</div>
          )}

          {!loading && result && (result.rows?.length ?? 0) > 0 && (
            <div className="overflow-auto">
              <table className="min-w-full border-separate" style={{ borderSpacing: 0 }}>
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="sticky top-0 z-10 border-b border-gray-200 px-4 py-2 text-left text-xs font-semibold text-gray-700 bg-gray-50"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row: RowObject, idx: number) => {
                    const isArr = Array.isArray(row);
                    const obj = (!isArr && row && typeof row === "object") ? (row as Record<string, unknown>) : null;
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        {columns.map((col) => {
                          let value: unknown;
                          if (isArr) {
                            const i = Number(col);
                            value = (row as unknown[])[i];
                          } else if (obj) {
                            value = obj[col];
                          }
                          const display = parseRowValue(value);
                          return (
                            <td key={col} className="border-b border-gray-100 px-4 py-2 text-sm text-gray-800">
                              <div className="max-w-[28rem] truncate" title={display}>
                                {display}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BigQueryExplorer;
