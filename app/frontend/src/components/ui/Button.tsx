import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

// One button. There were five "primary" strings before this, three with no
// focus ring — and a lot of these sit in a toolbar over a medical image.
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "chrome"
  | "chrome-primary";
export type ButtonSize = "xs" | "sm" | "md";

const FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
// Inside the dark viewer chrome the offset has to sit on chrome, not surface.
const FOCUS_CHROME =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-chrome-900";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: `bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-700 border border-transparent ${FOCUS}`,
  secondary: `bg-surface text-clinic-700 border border-clinic-200 hover:bg-clinic-50 hover:text-clinic-900 active:bg-clinic-100 ${FOCUS}`,
  ghost: `bg-transparent text-clinic-600 border border-transparent hover:bg-clinic-50 hover:text-clinic-900 ${FOCUS}`,
  danger: `bg-danger-soft text-danger-soft-ink border border-danger-500/30 hover:border-danger-500/60 ${FOCUS}`,
  chrome: `bg-chrome-800 text-chrome-200 border border-transparent hover:bg-chrome-700 hover:text-white active:bg-chrome-700 ${FOCUS_CHROME}`,
  "chrome-primary": `bg-accent-600 text-white border border-transparent hover:bg-accent-700 ${FOCUS_CHROME}`,
};

const SIZES: Record<ButtonSize, string> = {
  xs: "h-7 px-2 text-xs gap-1.5 rounded",
  sm: "h-8 px-3 text-sm gap-1.5 rounded-md",
  md: "h-9 px-4 text-sm gap-2 rounded-md",
};

// Square, so an icon-only hit target doesn't collapse to the glyph width.
const ICON_SIZES: Record<ButtonSize, string> = {
  xs: "h-7 w-7 text-xs rounded",
  sm: "h-8 w-8 text-sm rounded-md",
  md: "h-9 w-9 text-sm rounded-md",
};

function classesFor(
  variant: ButtonVariant,
  size: ButtonSize,
  iconOnly: boolean,
  className: string,
) {
  return [
    "inline-flex items-center justify-center font-medium whitespace-nowrap",
    "transition-colors duration-150",
    "disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none",
    iconOnly ? ICON_SIZES[size] : SIZES[size],
    VARIANTS[variant],
    className,
  ].join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a square button. Requires `aria-label` and `title`. */
  iconOnly?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "sm",
  iconOnly = false,
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={classesFor(variant, size, iconOnly, className)} {...rest}>
      {children}
    </button>
  );
}

/** Same treatment for router links, so a nav action matches the button beside it. */
export function ButtonLink({
  to,
  variant = "secondary",
  size = "sm",
  iconOnly = false,
  className = "",
  children,
  ...rest
}: {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "to" | "className">) {
  return (
    <Link to={to} className={classesFor(variant, size, iconOnly, className)} {...rest}>
      {children}
    </Link>
  );
}
