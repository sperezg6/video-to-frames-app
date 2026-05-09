"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { ExtractedFrame } from "@/lib/ffmpeg";

type Props = {
  frames: ExtractedFrame[];
  /** How many thumbnails to actually render. Defaults to 24. */
  cap?: number;
};

export function ThumbnailGrid({ frames, cap = 24 }: Props) {
  const shown = useMemo(() => frames.slice(0, cap), [frames, cap]);
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const next = shown.map((f) => {
      const buf = f.data.buffer.slice(
        f.data.byteOffset,
        f.data.byteOffset + f.data.byteLength,
      ) as ArrayBuffer;
      return URL.createObjectURL(new Blob([buf], { type: "image/png" }));
    });
    setUrls(next);
    return () => {
      next.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [shown]);

  if (urls.length === 0) return null;

  const extra = frames.length - urls.length;

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-overline text-mute">
          {frames.length} {frames.length === 1 ? "frame" : "frames"} extracted
        </span>
        {extra > 0 ? (
          <span className="text-overline text-mute">
            showing {urls.length} · {extra} more in zip
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {urls.map((url, i) => (
          <motion.div
            key={url}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: i * 0.04,
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ scale: 1.04 }}
            className="aspect-video overflow-hidden rounded-md bg-line"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={shown[i]?.name ?? `frame ${i}`}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
