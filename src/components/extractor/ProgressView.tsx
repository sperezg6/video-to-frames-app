"use client";

import { motion } from "motion/react";

type Props = {
  /** 0..1, may be NaN early */
  progress: number;
  /** Seconds processed so far */
  time: number;
  label?: string;
};

export function ProgressView({ progress, time, label = "Extracting" }: Props) {
  const pct = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="w-full flex flex-col gap-3"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-overline text-mute">{label}</span>
        <span className="tabular-nums text-display text-[15px]">
          {Math.round(pct * 100)}%
          <span className="text-mute"> · {time.toFixed(1)}s</span>
        </span>
      </div>
      <div className="relative h-[3px] w-full bg-line rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-ink"
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.2, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}
