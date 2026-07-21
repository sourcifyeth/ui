import { useEffect, useMemo, useState } from "react";
import { RiCodeAiLine } from "react-icons/ri";
import { FiExternalLink } from "react-icons/fi";
import Button from "../Button";
import { OPENROUTER_API_KEY } from "../../constants";

// The stable auto-router; always a valid free option regardless of rotation.
export const FREE_ROUTER_MODEL = "openrouter/free";

type FreeModel = { id: string; name: string };

// A model is usable on the built-in app key only if it's actually free.
export const isFreeModel = (id: string, freeModels: FreeModel[]): boolean => {
  const trimmed = id.trim();
  return (
    trimmed === FREE_ROUTER_MODEL ||
    freeModels.some((m) => m.id === trimmed) ||
    // Fallback when the live list couldn't be fetched.
    trimmed.endsWith(":free")
  );
};

type Props = {
  nlPrompt: string;
  setNlPrompt: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
  generating: boolean;
  onGenerate: (e: React.FormEvent<HTMLFormElement> | undefined) => void;
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
  const [freeModels, setFreeModels] = useState<FreeModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [customModel, setCustomModel] = useState(false);

  const usingBuiltInAppKey = useMemo(() => {
    return !apiKey && !!OPENROUTER_API_KEY;
  }, [apiKey]);

  // Fetch the current list of free models from OpenRouter on mount. This is a
  // public endpoint (no key required) so the dropdown always reflects what's
  // actually available, instead of a hardcoded slug that goes stale.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/models");
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        const list: any[] = Array.isArray(json?.data) ? json.data : [];
        const free = list
          .filter(
            (m) =>
              m?.pricing &&
              Number(m.pricing.prompt) === 0 &&
              Number(m.pricing.completion) === 0 &&
              // Only text-output models are useful for SQL generation.
              (m?.architecture?.output_modalities?.includes("text") ?? true) &&
              m.id !== FREE_ROUTER_MODEL
          )
          .map((m) => ({ id: m.id as string, name: (m.name as string) || m.id }))
          .sort((a, b) => a.name.localeCompare(b.name));
        if (active) setFreeModels(free);
      } catch {
        // Leave the list empty; the stable router default still works and the
        // ":free" fallback in isFreeModel keeps custom entries usable.
      } finally {
        if (active) setModelsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // If the current model isn't a known dropdown option, treat it as custom.
  useEffect(() => {
    const trimmed = model?.trim();
    if (!trimmed) return;
    const known = trimmed === FREE_ROUTER_MODEL || freeModels.some((m) => m.id === trimmed);
    if (!known) setCustomModel(true);
  }, [model, freeModels]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!generating && modelValid === true) {
        onGenerate(undefined);
      }
    }
  };

  // Debounced model validation against OpenRouter API
  useEffect(() => {
    let active = true;
    if (!model?.trim()) {
      setModelValid(null);
      return;
    }
    const trimmed = model.trim();
    // The stable router and any model from the fetched free list are known-good;
    // skip the network round-trip for them.
    if (trimmed === FREE_ROUTER_MODEL || freeModels.some((m) => m.id === trimmed)) {
      setValidatingModel(false);
      setModelValid(true);
      return;
    }
    // If using the app key (built-in), only free models are allowed.
    if (usingBuiltInAppKey) {
      setModelValid(isFreeModel(trimmed, freeModels));
      return;
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
  }, [apiKey, model, usingBuiltInAppKey, freeModels]);

  return (
    <form onSubmit={onGenerate} className="bg-white rounded-xl shadow overflow-hidden mb-6">
      <div className="p-4">
        <label className="text-ceruleanBlue-500 mb-2 font-semibold flex items-center justify-center gap-2 text-lg">
          <RiCodeAiLine className="text-lg" />
          AI query generator
        </label>
        <div className="mb-2 flex flex-wrap gap-2 bg-ceruleanBlue-50 rounded-md px-2 py-2 items-center justify-center">
          <span className="text-xs text-ceruleanBlue-700 mr-1 font-medium">Examples:</span>
          {[
            "Give me contracts with Solidity version 0.4.26",
            "Give me deployments of GnosisSafeProxy on Base",
            "Which contract is the most popular contract?",
          ].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setNlPrompt(example)}
              className="text-xs px-3 py-1 rounded-full border bg-ceruleanBlue-100 border-ceruleanBlue-400 text-ceruleanBlue-900 hover:bg-ceruleanBlue-200 hover:border-ceruleanBlue-500 hover:text-ceruleanBlue-900 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
        <textarea
          value={nlPrompt}
          onChange={(e) => setNlPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., List top 10 contracts by verification date (Cmd+Enter to submit)"
          rows={4}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ceruleanBlue-300 resize-y"
        />

        <div className="mt-3 flex flex-col md:flex-row gap-2 md:gap-3 items-start">
          <div className="flex flex-col gap-1 flex-1 w-full">
            <div className="flex items-center gap-1">
              <label className="text-sm text-gray-600">Model</label>
              <a
                href="https://openrouter.ai/models?order=newest&q=%3Afree"
                target="_blank"
                rel="noopener noreferrer"
                title="Browse all free models on OpenRouter"
                aria-label="Browse all free models on OpenRouter"
                className="text-gray-400 hover:text-ceruleanBlue-600 transition-colors"
              >
                <FiExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
              {modelsLoading && (
                <svg className="animate-spin h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              )}
            </div>
            <div className="flex items-center gap-2 w-full">
              <select
                value={customModel ? "__custom__" : model}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__custom__") {
                    setCustomModel(true);
                    setModel("");
                  } else {
                    setCustomModel(false);
                    setModel(v);
                  }
                }}
                className="border border-gray-200 rounded-md px-2 py-2 text-sm w-full bg-white"
              >
                <option value={FREE_ROUTER_MODEL}>Auto — random free model (recommended)</option>
                {freeModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
                {!usingBuiltInAppKey && <option value="__custom__">Custom model ID…</option>}
              </select>
              {validatingModel && (
                <svg className="animate-spin h-4 w-4 text-gray-500 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              )}
              {modelValid === true && !validatingModel && <span className="text-green-600 text-xs shrink-0">Valid</span>}
              {modelValid === false && !validatingModel && <span className="text-red-600 text-xs shrink-0">Invalid</span>}
            </div>
            {customModel && (
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="author/slug (any model, requires your key)"
                className="border border-gray-200 rounded-md px-2 py-2 text-sm w-full"
              />
            )}
          </div>

          <div className="flex-1 flex flex-col gap-1 items-start md:items-end justify-center">
            <div className="flex items-center gap-2">
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
            <div>
              <div className="text-xs text-gray-500">
                {apiKey
                  ? "Using your OpenRouter key — any model supported"
                  : "No key — free models only. Add a key to use any model."}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Button className="uppercase" disabled={generating || modelValid !== true} htmlType="submit">
            {generating ? "Generating…" : "Generate SQL"}
          </Button>
        </div>
      </div>
      {genError && <div className="px-4 py-3 bg-red-50 text-red-700 border-t border-red-200 text-sm break-words">{genError}</div>}
    </form>
  );
};

export default AIGenerator;
