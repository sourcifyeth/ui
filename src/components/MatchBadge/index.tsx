import { IoCheckmarkDoneCircle, IoCheckmarkCircle } from "react-icons/io5";

interface MatchBadgeProps {
  match: "match" | "exact_match" | null;
  className?: string;
  small?: boolean;
}

const MatchBadge = ({ match, className = "", small = false }: MatchBadgeProps) => {
  const sizeClasses = small ? "px-2 py-1 text-xs md:text-sm whitespace-nowrap" : "px-2 py-1 md:px-3 md:py-1 text-sm md:text-base whitespace-nowrap";
  const iconSize = small ? "text-xl" : "text-2xl md:text-3xl";

  if (!match) {
    return (
      <span
        className={`inline-flex items-center ${sizeClasses} rounded-md font-semibold border bg-gray-100 text-gray-600 border-gray-200 flex-shrink-0 ${className}`}
      >
        <span className={`mr-1 ${iconSize}`}>-</span> No Match
      </span>
    );
  }

  const isExactMatch = match === "exact_match";
  const label = isExactMatch ? "Exact Match" : "Match";
  const tooltipContent = isExactMatch
    ? "Exact match: The onchain and compiled bytecode match exactly, including the metadata hashes."
    : "Match: The onchain and compiled bytecode match, but metadata hashes differ or don't exist.";

  return (
    <span
      className={`inline-flex items-center ${sizeClasses} rounded-md font-semibold border bg-green-100 text-green-800 border-green-200 cursor-help flex-shrink-0 ${className}`}
      data-tooltip-id="global-tooltip"
      data-tooltip-content={tooltipContent}
    >
      <span className={`mr-1 ${iconSize}`}>
        {isExactMatch ? <IoCheckmarkDoneCircle /> : <IoCheckmarkCircle />}
      </span>
      {label}
    </span>
  );
};

export default MatchBadge;
