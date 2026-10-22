import { MouseEventHandler, ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  /** "secondary": light blue, "white": light gray. Anything else: the primary blue button. */
  type?: string;
  htmlType?: "button" | "submit" | "reset";
  /** With href, the button is a link that looks like a button (a link must not sit inside a <button>) */
  href?: string;
  /** Open the href in a new tab */
  external?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
};

// One size for every button on the site: 44px tall, rounded, normal letter case
const BASE =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-center text-sm md:text-base font-semibold shadow-sm transition ease-in duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceruleanBlue-300 focus:ring-offset-ceruleanBlue-100 disabled:opacity-50 disabled:cursor-default";

const COLORS: Record<string, string> = {
  primary: "bg-ceruleanBlue-500 hover:bg-ceruleanBlue-600 disabled:hover:bg-ceruleanBlue-500 text-white",
  secondary: "bg-ceruleanBlue-100 hover:bg-[rgba(118,147,218,0.15)] text-ceruleanBlue-500",
  white: "bg-slate-50 hover:bg-slate-200 text-slate-900",
};

const Button = ({ children, type, className = "", onClick, disabled, htmlType, href, external }: ButtonProps) => {
  const classes = `${BASE} ${COLORS[type ?? ""] ?? COLORS.primary} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }

  return (
    <button type={htmlType || "button"} disabled={disabled} aria-disabled={disabled} className={classes} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
