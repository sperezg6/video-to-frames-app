"use client";

import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
};

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
      animate={{ scale: over ? 1.015 : 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
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
      <div
        className="relative w-full rounded-3xl border border-dashed transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] px-8 py-16 md:py-24 flex flex-col items-center justify-center gap-3 text-center"
        style={{
          borderColor: over ? "var(--ink)" : "var(--line)",
          background: over ? "rgba(10,10,10,0.03)" : "transparent",
        }}
      >
        <motion.div
          aria-hidden
          className="text-display text-[clamp(2.5rem,8vw,4.5rem)]"
          animate={{ y: over ? -4 : 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          ↓
        </motion.div>
        <p className="text-display text-[clamp(1.25rem,2.4vw,1.6rem)]">
          Drop a video here
        </p>
        <p className="text-serif-italic text-[clamp(0.95rem,1.4vw,1.05rem)] text-mute">
          or click to choose a file · mp4, mov, webm
        </p>
      </div>
    </motion.label>
  );
}
