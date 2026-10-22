export const REPOSITORY_URL = process.env.REACT_APP_REPOSITORY_URL;
export const VERIFY_URL = process.env.REACT_APP_VERIFY_URL;
export const SERVER_URL = process.env.REACT_APP_SERVER_URL;
export const BIGQUERY_API_URL = process.env.REACT_APP_BIGQUERY_API_URL;
export const BIGQUERY_DATASET_NAME =
  process.env.REACT_APP_BIGQUERY_DATASET_NAME;
export const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
export const UMAMI_WEBSITE_ID = process.env.REACT_APP_UMAMI_WEBSITE_ID;
// Server-Sent Events stream with the live verified-contract count. Same-origin path on sourcify.dev and staging.sourcify.dev.
export const LIVE_STATS_URL = process.env.REACT_APP_LIVE_STATS_URL || "/live/stream";
export const DOCS_URL = "https://docs.sourcify.dev";
// Production builds set REACT_APP_TAG to "master". Every other build (staging, Netlify previews, the local dev
// server) is staging: it shows the staging banner and reads the staging stats and 4byte database.
export const IS_STAGING = process.env.REACT_APP_TAG !== "master";

export const GITTER_URL = `https://gitter.im/ethereum/source-verify`;
export const GITHUB_URL = `https://github.com/argotorg/sourcify`;
export const TWITTER_URL = `https://x.com/sourcifyeth`;
