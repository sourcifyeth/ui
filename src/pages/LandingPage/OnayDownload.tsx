// The download button of the Onay card: the latest release package for the visitor's system.
// It reads the latest release from the GitHub API. Until that answer comes, and if it never comes,
// the button points at the page of the latest release, which lists every package.
import { useEffect, useState } from "react";
import { FaDownload } from "react-icons/fa";

const REPO = "sourcifyeth/onay";
const LATEST_RELEASE_PAGE = `https://github.com/${REPO}/releases/latest`;
const LATEST_RELEASE_API = `https://api.github.com/repos/${REPO}/releases/latest`;

export type Target = "macos" | "linux";

// The package of each system. There is no Windows package yet, so Windows gets no button.
const PACKAGES: Record<Target, { label: string; suffix: string }> = {
  macos: { label: "macOS (Apple silicon)", suffix: ".dmg" },
  linux: { label: "Linux (.deb)", suffix: ".deb" },
};

// The system of the visitor from the user agent, or null when there is no package for it.
// Phones and tablets come first: an iPad can call itself a Macintosh, and Android has "Linux" in it.
export const detectTarget = (userAgent: string): Target | null => {
  if (/Android|iPhone|iPad|iPod|Mobile|CrOS/i.test(userAgent)) return null;
  if (/Macintosh|Mac OS X/.test(userAgent)) return "macos";
  if (/Linux|X11/.test(userAgent)) return "linux";
  return null;
};

type Asset = { name: string; browser_download_url: string };
type Release = { tag_name: string; assets: Asset[] };

// The package of a target in a release, or null when the release has none
export const findPackage = (release: Release, target: Target) => {
  const asset = release.assets.find((a) => a.name.endsWith(PACKAGES[target].suffix));
  return asset ? { url: asset.browser_download_url, version: release.tag_name } : null;
};

const OnayDownload = () => {
  const [target] = useState(() => detectTarget(navigator.userAgent));
  const [latest, setLatest] = useState<{ url: string; version: string } | null>(null);

  useEffect(() => {
    if (!target) return;
    fetch(LATEST_RELEASE_API)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`GitHub answered ${r.status}`))))
      .then((release: Release) => setLatest(findPackage(release, target)))
      .catch(() => setLatest(null));
  }, [target]);

  if (!target) return null;

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <a
        href={latest?.url ?? LATEST_RELEASE_PAGE}
        className="inline-flex items-center gap-2 rounded-full bg-ceruleanBlue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-ceruleanBlue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceruleanBlue-300"
      >
        <FaDownload aria-hidden="true" />
        Download for {PACKAGES[target].label}
        {latest && <span className="font-normal text-ceruleanBlue-100">{latest.version}</span>}
      </a>
      <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-800">
        Alpha
      </span>
    </span>
  );
};

export default OnayDownload;
