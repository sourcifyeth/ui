// The word "readable" in the hero. It starts as "0x" and 8 random hex digits (one for each letter).
// The digits change at random until each letter locks into place, left to right. Every few seconds
// the word changes back to hex and decodes again.
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const WORD = "readable";
const LETTERS = WORD.split("");
const HEX_DIGITS = "0123456789abcdef";
const randomHex = () => HEX_DIGITS[Math.floor(Math.random() * 16)];

// IBM Plex Mono Bold: the mono member of the heading's font family, with the same height and baseline.
// (The Tailwind config replaces the font list, so "font-mono" does not exist here.)
// The extra letter spacing undoes the heading's tracking-tight, which squeezes the mono digits.
const HEX_CLASS = "font-['IBM_Plex_Mono',Menlo,monospace] font-bold tracking-[0.04em] text-ceruleanBlue-400";

const START_MS = 700; // The heading fades in during the first 0.6 s
const DECODE_STEP_MS = 110;
const ENCODE_STEP_MS = 50;
const HOLD_WORD_MS = 6000;
const HOLD_HEX_MS = 1000;

export default function ReadableWord() {
  const reduceMotion = useReducedMotion();
  // true: the slot shows its letter; false: it shows a hex digit
  const [decoded, setDecoded] = useState<boolean[]>(() => LETTERS.map(() => !!reduceMotion));
  const [digits, setDigits] = useState<string[]>(() => LETTERS.map(randomHex));

  useEffect(() => {
    if (reduceMotion) {
      setDecoded(LETTERS.map(() => true));
      return;
    }
    let timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    // Change the slots one at a time. Returns the time when the last slot changes.
    const run = (toLetters: boolean, startMs: number, stepMs: number, reverse: boolean) => {
      LETTERS.forEach((_, i) => {
        const index = reverse ? LETTERS.length - 1 - i : i;
        later(startMs + i * stepMs, () => setDecoded((d) => d.map((v, j) => (j === index ? toLetters : v))));
      });
      return startMs + LETTERS.length * stepMs;
    };
    const cycle = (start: number) => {
      timers = [];
      const decodedAt = run(true, start, DECODE_STEP_MS, false);
      const encodedAt = run(false, decodedAt + HOLD_WORD_MS, ENCODE_STEP_MS, true);
      later(encodedAt + HOLD_HEX_MS, () => cycle(0));
    };
    cycle(START_MS);
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [reduceMotion]);

  // New random digits every 60 ms, while some slots show hex
  const cycling = decoded.some((d) => !d);
  useEffect(() => {
    if (!cycling) return;
    const t = window.setInterval(() => setDigits(LETTERS.map(randomHex)), 60);
    return () => window.clearInterval(t);
  }, [cycling]);

  return (
    <span className="relative inline-block whitespace-nowrap">
      {/* Screen readers always read the word, never the hex */}
      <span className="sr-only">{WORD}</span>
      <span aria-hidden="true">
        <AnimatePresence initial={false}>
          {cycling && (
            <motion.span
              key="0x"
              // inline-flex: with overflow-hidden, an inline-block moves its baseline to its bottom edge
              className={`inline-flex overflow-hidden ${HEX_CLASS}`}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              0x
            </motion.span>
          )}
        </AnimatePresence>
        {LETTERS.map((letter, i) => (
          <Slot key={i} letter={letter} decoded={decoded[i]} digit={digits[i]} />
        ))}
      </span>
    </span>
  );
}

// One letter, or a hex digit in its place until it is decoded. Each digit takes its own width,
// so a digit never overlaps a narrow letter such as "l".
function Slot({ letter, decoded, digit }: { letter: string; decoded: boolean; digit: string }) {
  return (
    <motion.span
      key={decoded ? "letter" : "hex"}
      className={`inline-block ${decoded ? "" : HEX_CLASS}`}
      initial={decoded ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {decoded ? letter : digit}
    </motion.span>
  );
}
