import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../Button";
import { bigquery, BigQueryResponse } from "../../utils/api";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

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
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BigQueryResponse | null>(null);
  const [nlPrompt, setNlPrompt] = useState<string>(
    "Show the latest 10 verified contracts with address and chainId."
  );
  const [generating, setGenerating] = useState(false);
  const [model, setModel] = useState<string>(
    "deepseek/deepseek-chat-v3.1:free"
  );
  const [useCustomModel, setUseCustomModel] = useState<boolean>(false);
  const [customModel, setCustomModel] = useState<string>("");

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

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bigquery(sql);
      setResult(res);
    } catch (e: any) {
      setResult(null);
      setError(e?.message || "Failed to run query");
    } finally {
      setLoading(false);
    }
  };

  const openrouterApiKey =
    process.env.REACT_APP_OPENROUTER_API_KEY || process.env.REACT_APP_OPENROUTER_KEY;
  const openrouter = useMemo(() => {
    if (!openrouterApiKey) return null;
    return createOpenRouter({ apiKey: openrouterApiKey });
  }, [openrouterApiKey]);

  const handleGenerate = async () => {
    if (!openrouter) {
      setError(
        "OpenRouter not configured. Set REACT_APP_OPENROUTER_API_KEY and restart."
      );
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const chosenModel = useCustomModel && customModel ? customModel : model;
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
      setError(e?.message || "Failed to generate SQL");
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
          <div className="border-b border-gray-200 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-2">Describe your query</label>
              <input
                value={nlPrompt}
                onChange={(e) => setNlPrompt(e.target.value)}
                placeholder="e.g., List top 10 contracts by verification date"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ceruleanBlue-300"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 items-stretch md:items-center md:pl-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Model</label>
                <select
                  className="border border-gray-200 rounded-md px-2 py-2 text-sm bg-white"
                  value={useCustomModel ? "__custom__" : model}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__custom__") {
                      setUseCustomModel(true);
                    } else {
                      setUseCustomModel(false);
                      setModel(v);
                    }
                  }}
                >
                  <option value="google/gemini-2.0-flash-lite-preview-02-05:free">Gemini 2.0 Flash Lite (Free)</option>
                  <option value="meta-llama/llama-3.1-8b-instruct:free">Llama 3.1 8B Instruct (Free)</option>
                  <option value="mistralai/mistral-7b-instruct:free">Mistral 7B Instruct (Free)</option>
                  <option value="qwen/qwen2.5-7b-instruct:free">Qwen2.5 7B Instruct (Free)</option>
                  <option value="__custom__">Custom…</option>
                </select>
              </div>
              <span className="text-xs text-gray-500">Only free models supported</span>
              {useCustomModel && (
                <input
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="provider/model:free"
                  className="border border-gray-200 rounded-md px-2 py-2 text-sm"
                />
              )}
              <Button onClick={handleGenerate} className="uppercase" >
                {generating ? "Generating…" : "Generate SQL"}
              </Button>
            </div>
          </div>
          {!openrouterApiKey && (
            <div className="px-4 py-3 bg-yellow-50 text-yellow-800 border-t border-yellow-200 text-sm">
              To enable AI generation, add REACT_APP_OPENROUTER_API_KEY to your environment and restart.
              Only free models are supported.
            </div>
          )}
        </div>

        {/* Editor Card */}
        <div className="bg-white rounded-xl shadow overflow-hidden mb-8">
          <div className="border-b border-gray-200 p-4 flex items-center justify-between gap-4">
            <span className="text-sm text-gray-600">SQL Editor</span>
            <div className="flex items-center gap-2">
              <Button onClick={handleExecute} className="uppercase" >
                {loading ? "Executing..." : "Execute"}
              </Button>
            </div>
          </div>

          <div className="relative flex w-full" style={{ height: 260 }}>
            {/* Gutter */}
            <div
              ref={gutterRef}
              className="select-none text-right text-xs leading-6 px-3 py-3 bg-[#0f172a] text-gray-400 border-r border-gray-700"
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
              className="flex-1 text-sm leading-6 p-3 font-mono bg-[#111827] text-gray-100 outline-none resize-none"
              style={{
                tabSize: 2,
                MozTabSize: 2 as unknown as number,
                overflow: "auto",
              }}
              placeholder="Write your SQL here..."
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-700 border-t border-red-200 text-sm">
              {error}
            </div>
          )}
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
