import { useEffect, useMemo, useRef, useState } from "react";
import { bigquery, BigQueryResponse } from "../../utils/api";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { DEFAULT_SQL, SYSTEM_PROMPT, DEFAULT_PROMPT, DEFAULT_MODEL } from "./constants";
import AIGenerator from "./AIGenerator";
import SqlEditor from "./SqlEditor";
import Results from "./Results";
import { OPENROUTER_API_KEY } from "../../constants";
import { motion, useInView } from "framer-motion";

const BigQueryExplorer = () => {
  const [sql, setSql] = useState<string>(DEFAULT_SQL);
  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [bqError, setBqError] = useState<string | null>(null);
  const [result, setResult] = useState<BigQueryResponse | null>(null);
  const [nlPrompt, setNlPrompt] = useState<string>(DEFAULT_PROMPT);
  const [generating, setGenerating] = useState(false);
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [apiKey, setApiKey] = useState<string>("");
  const titleRef = useRef(null);
  const isTitleInView = useInView(titleRef, { once: true });

  const handleExecute = async () => {
    setLoading(true);
    setBqError(null);
    try {
      const res = await bigquery(sql);
      setResult(res);
    } catch (e: any) {
      setResult(null);
      setBqError(e?.message || "Unknow error executing query");
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
    return (apiKey || OPENROUTER_API_KEY || "").trim();
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
      const usingAppKey = !apiKey && (OPENROUTER_API_KEY);
      if (usingAppKey && !chosenModel.trim().endsWith(":free")) {
        throw new Error("Only :free models are supported with the built-in key");
      }
      const system = SYSTEM_PROMPT;
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

  return (
    <section className=" md:px-12 lg:px-24 bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          ref={titleRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isTitleInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-6xl text-ceruleanBlue-500 font-bold text-center mb-10"
        >
          BigQuery Explorer
        </motion.h1>
        <p className="text-gray-600 mb-6 text-center max-w-3xl mx-auto">
          Write a SQL query and execute it against the dataset. Results show below.
        </p>
        <AIGenerator
          nlPrompt={nlPrompt}
          setNlPrompt={setNlPrompt}
          model={model}
          setModel={setModel}
          apiKey={apiKey}
          setApiKey={setApiKey}
          generating={generating}
          onGenerate={handleGenerate}
          genError={genError}
        />

        <SqlEditor
          sql={sql}
          setSql={setSql}
          onExecute={handleExecute}
          loading={loading}
          generating={generating}
        />

        <Results result={result} loading={loading} error={bqError} />
      </div>
    </section>
  );
};

export default BigQueryExplorer;
