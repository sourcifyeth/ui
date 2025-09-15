import { useEffect, useMemo, useState } from "react";
import { BigQueryResponse } from "../../utils/api";
import { RowObject, computeColumns, parseRowValue } from "./utils";

type Props = {
  result: BigQueryResponse | null;
  loading: boolean;
  error: string | null;
};

const Results = ({ result, loading, error }: Props) => {
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(0);

  // Reset pagination when a new result set arrives
  useEffect(() => {
    setPage(0);
  }, [result]);

  const columns: string[] = useMemo(() => computeColumns(result?.rows), [result]);

  const totalRows = result?.rows?.length ?? 0;
  const startIdx = page * pageSize;
  const endIdxExclusive = Math.min(startIdx + pageSize, totalRows);
  const paginatedRows = useMemo(
    () => (result?.rows ?? []).slice(startIdx, endIdxExclusive),
    [result, startIdx, endIdxExclusive]
  );
  const isFirstPage = page === 0;
  const isLastPage = endIdxExclusive >= totalRows;
  const showingFrom = totalRows === 0 ? 0 : startIdx + 1;
  const showingTo = endIdxExclusive;

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="border-b border-gray-200 p-4">
        <h3 className="font-semibold">Results</h3>
        <div className="mt-2 text-sm text-gray-600 flex flex-wrap items-center gap-4">
          <div>
            <span className="text-gray-500">Rows:</span> {result?.rowCount ?? 0}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Show:</span>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
              value={pageSize}
              onChange={(e) => {
                const newSize = parseInt(e.target.value, 10);
                setPageSize(newSize);
                setPage(0);
              }}
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-gray-500">per page</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-gray-600">
              Showing {showingFrom}-{showingTo} of {totalRows}
            </div>
            <div className="flex items-center gap-2">
              <button
                className={`px-3 py-1 rounded border text-sm ${
                  isFirstPage
                    ? "text-gray-400 border-gray-200 cursor-not-allowed"
                    : "text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                disabled={isFirstPage}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <button
                className={`px-3 py-1 rounded border text-sm ${
                  isLastPage
                    ? "text-gray-400 border-gray-200 cursor-not-allowed"
                    : "text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                disabled={isLastPage}
                onClick={() => setPage((p) => (isLastPage ? p : p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-700 border-t border-red-200 text-sm">
          {error}
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
              {paginatedRows.map((row: RowObject, idx: number) => {
                const isArr = Array.isArray(row);
                const obj = (!isArr && row && typeof row === "object") ? (row as Record<string, unknown>) : null;
                return (
                  <tr key={`${startIdx + idx}`} className={(startIdx + idx) % 2 === 0 ? "bg-white" : "bg-gray-50"}>
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
  );
};

export default Results;
