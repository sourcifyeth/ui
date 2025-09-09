import { useMemo } from "react";
import { BigQueryResponse } from "../../utils/api";
import { RowObject, computeColumns, formatNumber, parseRowValue } from "./utils";

type Props = {
  result: BigQueryResponse | null;
  loading: boolean;
  error: string | null;
};

const Results = ({ result, loading, error }: Props) => {
  const columns: string[] = useMemo(() => computeColumns(result?.rows), [result]);

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="border-b border-gray-200 p-4">
        <h3 className="font-semibold">Results</h3>
        <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-4">
          <div>
            <span className="text-gray-500">Rows:</span> {result?.rowCount ?? 0}
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
  );
};

export default Results;

