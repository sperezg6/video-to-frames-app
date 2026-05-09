"use client";

import { motion } from "motion/react";
import type { ExtractionMode } from "@/lib/ffmpeg";

type Props = {
  mode: ExtractionMode;
  onChange: (mode: ExtractionMode) => void;
  disabled?: boolean;
};

export function SettingsPanel({ mode, onChange, disabled }: Props) {
  const isEvery = mode.kind === "every";
  const isFps = mode.kind === "fps";
  const isInterval = mode.kind === "interval";
  const intervalSeconds = isInterval ? mode.seconds : 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full flex flex-col gap-3"
    >
      <div className="text-overline text-mute">Extraction rate</div>

      <Row
        active={isEvery}
        disabled={disabled}
        onClick={() => onChange({ kind: "every" })}
        label="Every frame"
        hint="One image per video frame (~30/sec)"
      />
      <Row
        active={isFps}
        disabled={disabled}
        onClick={() => onChange({ kind: "fps", value: 1 })}
        label="One frame per second"
        hint="Light, fast — good for an overview"
      />
      <Row
        active={isInterval}
        disabled={disabled}
        onClick={() => onChange({ kind: "interval", seconds: intervalSeconds })}
        label={
          <span className="flex items-center gap-2">
            Every
            <input
              type="number"
              min={1}
              max={600}
              value={intervalSeconds}
              disabled={disabled}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const n = Math.max(1, Math.min(600, Number(e.target.value) || 1));
                onChange({ kind: "interval", seconds: n });
              }}
              className="w-14 rounded-md border border-line bg-transparent px-2 py-1 text-center text-display text-[15px] focus:outline-none focus:border-ink tabular-nums"
            />
            seconds
          </span>
        }
        hint="Custom interval"
      />
    </motion.div>
  );
}

function Row({
  active,
  disabled,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: React.ReactNode;
  hint: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] text-left disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        borderColor: active ? "var(--ink)" : "var(--line)",
        background: active ? "rgba(10,10,10,0.03)" : "transparent",
      }}
    >
      <span className="flex items-center gap-3 text-display text-[15px]">
        <span
          className="inline-block w-3 h-3 rounded-full transition-colors duration-150"
          style={{
            background: active ? "var(--ink)" : "transparent",
            border: "1px solid var(--ink)",
          }}
        />
        {label}
      </span>
      <span className="text-overline text-mute hidden md:inline">{hint}</span>
    </button>
  );
}
