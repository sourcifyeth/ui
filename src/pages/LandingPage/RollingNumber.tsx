import { AnimatePresence, motion } from "framer-motion";

type RollingNumberProps = {
  value: number;
  /** False: show the number as plain text (reduced motion, or while the first count-up runs) */
  roll: boolean;
  className?: string;
};

/**
 * A number like an odometer: when it changes, each changed digit rolls. The old digit slides up and out,
 * the new one slides in from below. Digits are keyed by their place from the right, so a "9" that becomes
 * "0" rolls in the same column, and a new leading digit appears on the left.
 */
const RollingNumber = ({ value, roll, className = "" }: RollingNumberProps) => {
  const text = value.toLocaleString();
  if (!roll) return <span className={className}>{text}</span>;

  const chars = text.split("");
  return (
    <span className={`inline-flex ${className}`} aria-label={text}>
      {chars.map((char, i) => {
        const place = chars.length - i; // 1 = the last digit
        if (!/\d/.test(char)) {
          return (
            <span key={`sep-${place}`} aria-hidden="true">
              {char}
            </span>
          );
        }
        return (
          <span key={`digit-${place}`} className="relative inline-block overflow-hidden" aria-hidden="true">
            {/* An invisible digit keeps the column width and height while the visible ones move */}
            <span className="invisible">0</span>
            <AnimatePresence initial={false}>
              <motion.span
                key={char}
                className="absolute inset-0 text-center"
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                exit={{ y: "-100%" }}
                transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
              >
                {char}
              </motion.span>
            </AnimatePresence>
          </span>
        );
      })}
    </span>
  );
};

export default RollingNumber;
