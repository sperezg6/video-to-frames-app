"use client";

import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
};

const VARIANTS = {
  outer: {
    rest: { scale: 1 },
    hover: { scale: 1.005 },
    drag: { scale: 1.02 },
  },
  zone: {
    rest: {
      borderColor: "rgba(10, 10, 10, 0.12)",
      backgroundColor: "rgba(10, 10, 10, 0)",
    },
    hover: {
      borderColor: "rgba(10, 10, 10, 0.35)",
      backgroundColor: "rgba(10, 10, 10, 0.018)",
    },
    drag: {
      borderColor: "rgba(10, 10, 10, 1)",
      backgroundColor: "rgba(10, 10, 10, 0.04)",
    },
  },
  arrow: {
    rest: { y: 0, scale: 1 },
    hover: { y: 6, scale: 1.05 },
    drag: { y: -8, scale: 1.12 },
  },
  caption: {
    rest: { letterSpacing: "0em" },
    hover: { letterSpacing: "0.02em" },
    drag: { letterSpacing: "0.04em" },
  },
} as const;

const TRANS = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };

export function Dropzone({ onFile, disabled }: Props) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("video/") && !/\.(mp4|mov|m4v|webm|mkv)$/i.test(file.name)) {
        alert("Please drop a video file (mp4, mov, webm, mkv).");
        return;
      }
      onFile(file);
    },
    [onFile],
  );

  const state = over ? "drag" : "rest";

  return (
    <motion.label
      htmlFor="video-input"
      className="block w-full cursor-pointer select-none"
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (disabled) return;
        handle(e.dataTransfer.files?.[0]);
      }}
      initial="rest"
      animate={state}
      whileHover={!disabled && !over ? "hover" : undefined}
      variants={VARIANTS.outer}
      transition={TRANS}
    >
      <input
        ref={inputRef}
        id="video-input"
        type="file"
        accept="video/*,.mp4,.mov,.m4v,.webm,.mkv"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => handle(e.target.files?.[0] ?? undefined)}
      />
      <motion.div
        variants={VARIANTS.zone}
        transition={TRANS}
        className="relative w-full rounded-3xl border border-dashed px-8 py-16 md:py-24 flex flex-col items-center justify-center gap-3 text-center"
      >
        <motion.div
          aria-hidden
          variants={VARIANTS.arrow}
          transition={TRANS}
          className="text-display text-[clamp(2.5rem,8vw,4.5rem)] origin-center"
        >
          ↓
        </motion.div>
        <motion.p
          variants={VARIANTS.caption}
          transition={TRANS}
          className="text-display text-[clamp(1.25rem,2.4vw,1.6rem)]"
        >
          Drop a video here
        </motion.p>
        <p className="text-serif-italic text-[clamp(0.95rem,1.4vw,1.05rem)] text-mute">
          or click to choose a file · mp4, mov, webm
        </p>
      </motion.div>
    </motion.label>
  );
}
