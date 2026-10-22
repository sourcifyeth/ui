import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import solidityLang from "react-syntax-highlighter/dist/esm/languages/prism/solidity";
import codeStyle from "react-syntax-highlighter/dist/esm/styles/prism/dracula";
import ComparisonSlider, { CODE_BG } from "./ComparisonSlider";
import { bytecode, solidityCode } from "./example";

SyntaxHighlighter.registerLanguage("solidity", solidityLang);

// The hero's example contract: Solidity source on the left of the handle, its bytecode on the right
const SourceBytecodeSlider = () => (
  <ComparisonSlider
    leftLabel="Source code"
    rightLabel="Bytecode"
    ariaLabel="Compare source code and bytecode"
    left={
      <SyntaxHighlighter
        language="solidity"
        style={codeStyle}
        customStyle={{ margin: 0, background: CODE_BG, height: "100%", overflow: "hidden" }}
        className="h-full w-full text-xs"
      >
        {solidityCode}
      </SyntaxHighlighter>
    }
    right={<div className="h-full p-4 font-mono text-xs text-gray-300 break-all">{bytecode}</div>}
  />
);

export default SourceBytecodeSlider;
