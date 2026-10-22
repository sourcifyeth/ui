import { FaArrowRight } from "react-icons/fa";
import { CODE_BG } from "./ComparisonSlider";

// A Uniswap V3 swap on Ethereum: exactInputSingle on the SwapRouter, 1,000 USDC in, at least 0.42 WETH out
const word = (hex: string) => hex.replace(/^0x/, "").toLowerCase().padStart(64, "0");
const CALLDATA =
  "0x414bf389" + // exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))
  word("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48") + // tokenIn: USDC
  word("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2") + // tokenOut: WETH
  word((500).toString(16)) + // fee: the 0.05% pool
  word("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045") + // recipient
  word((1774958400).toString(16)) + // deadline: 2026-03-31 12:00 UTC
  word((1_000 * 10 ** 6).toString(16)) + // amountIn: 1,000 USDC (6 decimals)
  word(BigInt("420000000000000000").toString(16)) + // amountOutMinimum: 0.42 WETH (18 decimals)
  word("0"); // sqrtPriceLimitX96: no limit

// What the wallet shows with the ERC-7730 descriptor
const fields: [string, string][] = [
  ["Action", "Swap"],
  ["Send", "1,000 USDC"],
  ["Receive min.", "0.42 WETH"],
  ["Protocol", "Uniswap V3"],
  ["Network", "Ethereum"],
];

// Raw calldata on the left, the clear signed view on the right
const ClearSigningExample = () => (
  <div
    className="grid grid-cols-[1fr_auto_1fr] items-stretch rounded-xl p-5 shadow-xl ring-1 ring-white/10"
    style={{ background: CODE_BG }}
  >
    {/* The clear signing side sets the height. The calldata is cut off below it and fades out. */}
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden">
        <span className="inline-block mb-3 rounded-full bg-gray-900/80 px-2.5 py-1 text-xs font-semibold text-gray-200 ring-1 ring-white/15">
          Blind signing
        </span>
        <div className="font-mono text-[11px] leading-relaxed text-gray-500 break-all">{CALLDATA}</div>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-10"
        style={{ background: `linear-gradient(to top, ${CODE_BG}, transparent)` }}
        aria-hidden="true"
      />
    </div>

    {/* Divider with a round arrow in the middle */}
    <div className="relative mx-4 flex items-center justify-center">
      <div className="absolute inset-y-0 w-px bg-gray-700" aria-hidden="true" />
      <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-600 text-gray-300 text-xs" style={{ background: CODE_BG }}>
        <FaArrowRight aria-hidden="true" />
      </div>
    </div>

    <div className="flex flex-col">
      <span className="self-start mb-3 rounded-full bg-ceruleanBlue-500/90 px-2.5 py-1 text-xs font-semibold text-white">
        Clear signing
      </span>
      <dl className="flex flex-1 flex-col justify-center divide-y divide-gray-800 text-sm">
        {fields.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3 py-2.5">
            <dt className="text-gray-400">{label}</dt>
            <dd className="font-mono text-ceruleanBlue-300 text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  </div>
);

export default ClearSigningExample;
