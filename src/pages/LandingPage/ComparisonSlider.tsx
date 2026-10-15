import { KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export const CODE_BG = "#111827";

type ComparisonSliderProps = {
  // Both sides fill the panel and stay in place, one over the other. The handle only moves the cut between them.
  left: ReactNode;
  right: ReactNode;
  leftLabel: string;
  rightLabel: string;
  ariaLabel: string;
};

// Before/after slider with a full-height handle that starts in the middle
const ComparisonSlider = ({ left, right, leftLabel, rightLabel, ariaLabel }: ComparisonSliderProps) => {
  const [position, setPosition] = useState(50); // in percent, from the left edge
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // The card around the slider can be swiped. These listeners are native, not React props, because
  // the pointerdown must stop here: then a drag on the slider moves the handle and does not swipe the card.
  // (React gets its events at the root of the page, so a stopped event never reaches React props.)
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const moveTo = (clientX: number) => {
      const rect = element.getBoundingClientRect();
      const percent = ((clientX - rect.left) / rect.width) * 100;
      setPosition(Math.min(100, Math.max(0, percent)));
    };
    const onDown = (e: PointerEvent) => {
      e.stopPropagation();
      isDragging.current = true;
      element.setPointerCapture?.(e.pointerId);
      moveTo(e.clientX);
    };
    const onMove = (e: PointerEvent) => isDragging.current && moveTo(e.clientX);
    const onUp = () => (isDragging.current = false);
    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onUp);
    return () => {
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - 5));
    else if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + 5));
    else return;
    e.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      className="relative h-72 md:h-80 w-full rounded-xl overflow-hidden select-none cursor-ew-resize shadow-xl ring-1 ring-white/10"
      style={{ background: CODE_BG, touchAction: "pan-y" }}
    >
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        {left}
      </div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${position}%)` }} aria-hidden="true">
        {right}
      </div>

      {/* Labels. Each one fades out when its side is almost hidden. */}
      <span
        className="pointer-events-none absolute top-3 left-3 rounded-full bg-ceruleanBlue-500/90 px-2.5 py-1 text-xs font-semibold text-white transition-opacity"
        style={{ opacity: position > 15 ? 1 : 0 }}
      >
        {leftLabel}
      </span>
      <span
        className="pointer-events-none absolute top-3 right-3 rounded-full bg-gray-900/80 px-2.5 py-1 text-xs font-semibold text-gray-200 ring-1 ring-white/15 transition-opacity"
        style={{ opacity: position < 85 ? 1 : 0 }}
      >
        {rightLabel}
      </span>

      {/* Handle: a full-height line with a round grip in the middle */}
      <div
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        onKeyDown={handleKeyDown}
        className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ceruleanBlue-300"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center gap-0.5 rounded-full bg-white text-[10px] text-ceruleanBlue-500 shadow-lg">
          <FaChevronLeft aria-hidden="true" />
          <FaChevronRight aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

export default ComparisonSlider;
