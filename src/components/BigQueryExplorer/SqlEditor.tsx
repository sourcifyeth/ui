import { useEffect, useMemo, useRef } from "react";
import Button from "../Button";
import "./styles.css";

type Props = {
  sql: string;
  setSql: (v: string) => void;
  onExecute: () => void;
  loading: boolean;
  generating: boolean;
};

const SqlEditor = ({ sql, setSql, onExecute, loading, generating }: Props) => {
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

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden mb-8">
      <div className="border-b border-gray-200 p-4 flex items-center justify-between gap-4">
        <span className="text-sm text-gray-600">SQL Editor</span>
        <div className="flex items-center gap-2">
          <Button onClick={onExecute} className="uppercase" disabled={generating || loading}>
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
            <svg
              className="animate-spin h-6 w-6 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-label="Generating"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default SqlEditor;
