import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../Button";
import { bigquery, BigQueryResponse } from "../../utils/api";

const DEFAULT_SQL = `-- Example: Latest verified contract's chain and address
SELECT chain_id, address
FROM sourcify_staging.public_verified_contracts vc
JOIN sourcify_staging.public_contract_deployments cd ON vc.deployment_id = cd.id
ORDER BY vc.created_at DESC
LIMIT 1;`;

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
