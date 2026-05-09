"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Tone = "dark" | "light";

type Props = {
  children: ReactNode;
  tone?: Tone;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function ButtonPill({
  tone = "light",
  className = "",
  children,
  ...rest
}: Props) {
  const tonal =
    tone === "dark"
      ? "bg-ink text-cream border border-ink hover:bg-[rgba(10,10,10,0.85)]"
      : "bg-transparent text-ink border border-ink hover:bg-ink hover:text-cream";

  const base = `
    group inline-flex items-center justify-center gap-2
    rounded-full px-7 py-3.5
    text-[15px] font-medium leading-none
    transition-[background-color,color,transform,opacity] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]
    active:scale-[0.97]
    disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
    ${tonal} ${className}
  `;

  return (
    <button {...rest} className={base}>
      {children}
    </button>
  );
}
