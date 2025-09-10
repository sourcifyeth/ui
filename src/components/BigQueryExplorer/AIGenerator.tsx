import { useEffect, useMemo, useState } from "react";
import Button from "../Button";
import { OPENROUTER_API_KEY } from "../../constants";

type Props = {
  nlPrompt: string;
  setNlPrompt: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
  generating: boolean;
  onGenerate: () => void;
  genError: string | null;
};

const AIGenerator = ({
  nlPrompt,
  setNlPrompt,
  model,
  setModel,
  apiKey,
  setApiKey,
  generating,
  onGenerate,
  genError,
}: Props) => {
  const [validatingModel, setValidatingModel] = useState(false);
  const [modelValid, setModelValid] = useState<boolean | null>(null);

  const usingBuiltInAppKey = useMemo(() => {
    return !apiKey && !!(OPENROUTER_API_KEY);
  }, [apiKey]);

  // Debounced model validation against OpenRouter API
  useEffect(() => {
    let active = true;
    if (!model?.trim()) {
      setModelValid(null);
      return;
    }
    const trimmed = model.trim();
    // If using the app key (built-in), only allow :free models
    if (usingBuiltInAppKey) {
      if (!trimmed.endsWith(":free")) {
        setModelValid(false);
        return;
      }
    }
    setValidatingModel(true);
    const slug = trimmed.split(":")[0];
    const timer = setTimeout(async () => {
      try {
        const usedKey = (apiKey || OPENROUTER_API_KEY || "").trim();
        if (!usedKey) {
          setModelValid(null);
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
        } else {
          const data = await res.json().catch(() => null);
          const ok = data && (Array.isArray(data) ? data.length > 0 : true);
          setModelValid(!!ok);
        }
      } catch (e: any) {
        if (!active) return;
        setModelValid(false);
      } finally {
        if (active) setValidatingModel(false);
      }
    }, 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, model, usingBuiltInAppKey]);

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
      <div className="p-4">
        <label className="block text-sm text-gray-600 mb-2">Describe your query</label>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 mr-1">Examples:</span>
          {[
            "Give me contracts with Solidity version 0.4.26",
            "Give me deployments of GnosisSafeProxy on Base",
            "Which contract is the most popular contract?",
          ].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setNlPrompt(example)}
              className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-700 hover:bg-ceruleanBlue-50 hover:border-ceruleanBlue-300 hover:text-ceruleanBlue-700 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
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
            <a
              href="https://openrouter.ai/models?order=newest&q=%3Afree"
              target="_blank"
              rel="noopener noreferrer"
              title="Find more free models"
              aria-label="Find more free models"
              className="text-gray-400 hover:text-ceruleanBlue-600 transition-colors"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="7" width="18" height="10" rx="5" />
                <circle cx="9" cy="12" r="3" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <div className="w-full">
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="author/slug:free (e.g., meta-llama/llama-3.1-8b-instruct:free)"
                className="border border-gray-200 rounded-md px-2 py-2 text-sm w-full"
              />
            </div>
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
              <span className="text-red-600 text-xs">Invalid</span>
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
          <Button onClick={onGenerate} className="uppercase" disabled={generating || modelValid !== true}>
            {generating ? "Generating…" : "Generate SQL"}
          </Button>
          <div className="text-xs text-gray-500">
            {apiKey ? "Using your OpenRouter key, all models supported" : "Using built-in key, only ':free' models supported"}
          </div>
        </div>
      </div>
      {genError && (
        <div className="px-4 py-3 bg-red-50 text-red-700 border-t border-red-200 text-sm">
          {genError}
        </div>
      )}
    </div>
  );
};

export default AIGenerator;
