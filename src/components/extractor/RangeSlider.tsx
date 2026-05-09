"use client";

import { formatClock } from "@/lib/video";

type Props = {
  duration: number;
  start: number;
  end: number;
  onChange: (next: { start: number; end: number }) => void;
  onScrub?: (t: number) => void;
  disabled?: boolean;
};

export function RangeSlider({
  duration,
  start,
  end,
  onChange,
  onScrub,
  disabled,
}: Props) {
  const step = duration > 60 ? 0.1 : 0.05;
  const min = 0;
  const max = duration;

  const startPct = (start / duration) * 100;
  const endPct = (end / duration) * 100;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between text-overline">
        <span className="text-mute">Trim</span>
        <span className="tabular-nums text-ink">
          {formatClock(start)} → {formatClock(end)}{" "}
          <span className="text-mute">({formatClock(end - start)})</span>
        </span>
      </div>

      <div className="relative h-8 flex items-center">
        <div className="absolute inset-x-0 h-[3px] bg-line rounded-full" />
        <div
          className="absolute h-[3px] bg-ink rounded-full"
          style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={start}
          disabled={disabled}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), end - step);
            onChange({ start: v, end });
            onScrub?.(v);
          }}
          className="range-thumb absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none"
          aria-label="Start time"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={end}
          disabled={disabled}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), start + step);
            onChange({ start, end: v });
            onScrub?.(v);
          }}
          className="range-thumb absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none"
          aria-label="End time"
        />
      </div>

      <style jsx>{`
        .range-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background: var(--cream);
          border: 2px solid var(--ink);
          cursor: pointer;
          pointer-events: auto;
          transition: transform 150ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .range-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .range-thumb::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background: var(--cream);
          border: 2px solid var(--ink);
          cursor: pointer;
          pointer-events: auto;
        }
        .range-thumb:disabled::-webkit-slider-thumb {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
