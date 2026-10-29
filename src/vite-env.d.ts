// The vite/client types come from "types" in tsconfig.json. This file adds the VITE_ variables that the app reads.
interface ImportMetaEnv {
  readonly VITE_SERVER_URL?: string;
  readonly VITE_REPOSITORY_URL?: string;
  readonly VITE_VERIFY_URL?: string;
  readonly VITE_TAG?: string;
  readonly VITE_UMAMI_WEBSITE_ID?: string;
  readonly VITE_BIGQUERY_API_URL?: string;
  readonly VITE_BIGQUERY_DATASET_NAME?: string;
  readonly VITE_LIVE_STATS_URL?: string;
  readonly VITE_OPENROUTER_API_KEY?: string;
}
