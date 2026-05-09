"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const STAGGER = 0.035;

type Props = {
  children: string;
  className?: string;
  center?: boolean;
};

export default function TextRoll({ children, className, center = false }: Props) {
  return (
    <motion.span
      initial="initial"
      whileHover="hovered"
      className={cn("relative block overflow-hidden", className)}
      style={{ lineHeight: 0.85 }}
    >
      <span className="block">
        {children.split("").map((l, i) => {
          const delay = center
            ? STAGGER * Math.abs(i - (children.length - 1) / 2)
            : STAGGER * i;
          return (
            <motion.span
              variants={{
                initial: { y: 0 },
                hovered: { y: "-100%" },
              }}
              transition={{ ease: "easeInOut", delay }}
              className="inline-block whitespace-pre"
              key={`top-${i}`}
            >
              {l}
            </motion.span>
          );
        })}
      </span>

      <span className="absolute inset-0 block" aria-hidden="true">
        {children.split("").map((l, i) => {
          const delay = center
            ? STAGGER * Math.abs(i - (children.length - 1) / 2)
            : STAGGER * i;
          return (
            <motion.span
              variants={{
                initial: { y: "100%" },
                hovered: { y: 0 },
              }}
              transition={{ ease: "easeInOut", delay }}
              className="inline-block whitespace-pre"
              key={`bot-${i}`}
            >
              {l}
            </motion.span>
          );
        })}
      </span>
    </motion.span>
  );
}
