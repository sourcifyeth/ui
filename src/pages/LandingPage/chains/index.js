import arbitrumLogo from "./logos/arbitrum.svg";
import optimismLogo from "./logos/optimism.svg";
import gnosisLogo from "./logos/gnosis.svg";
import baseLogo from "./logos/base.svg";
import lineaLogo from "./logos/linea.svg";
import ethereumLogo from "./logos/ethereum.svg";

export const chains = [
  {
    name: "Ethereum",
    logo: ethereumLogo,
  },
  {
    name: "Arbitrum",
    logo: arbitrumLogo,
  },
  {
    name: "Optimism",
    logo: optimismLogo,
  },
  {
    name: "Polygon",
    logo: new URL("./logos/polygon.webp", import.meta.url).href,
  },
  {
    name: "Gnosis",
    logo: gnosisLogo,
  },
  {
    name: "BNB Chain",
    logo: new URL("./logos/binance.png", import.meta.url).href,
  },
  {
    name: "Avalanche",
    logo: new URL("./logos/avalanche.png", import.meta.url).href,
  },
  {
    name: "Base",
    logo: baseLogo,
  },
  {
    name: "Linea",
    logo: lineaLogo,
  },
  {
    name: "Robinhood Chain",
    logo: new URL("./logos/robinhood.png", import.meta.url).href,
  },
  {
    name: "Zora",
    logo: new URL("./logos/zora.png", import.meta.url).href,
  },
];

export default chains;
