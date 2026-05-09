"use client";

import { useEffect, useMemo, useRef } from "react";
import { formatClock } from "@/lib/video";

type Props = {
  file: File;
  duration: number;
  /** Current scrub time in seconds; controlled */
  scrubTo?: number;
};

export function VideoPreview({ file, duration, scrubTo }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const url = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  useEffect(() => {
    if (typeof scrubTo === "number" && videoRef.current) {
      videoRef.current.currentTime = scrubTo;
    }
  }, [scrubTo]);

  const sizeMB = (file.size / 1_048_576).toFixed(1);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full overflow-hidden rounded-2xl border border-line bg-ink/5 aspect-video">
        <video
          ref={videoRef}
          src={url}
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="flex items-baseline justify-between text-overline text-mute">
        <span className="truncate text-display text-[14px] text-ink">{file.name}</span>
        <span className="tabular-nums">{formatClock(duration)} · {sizeMB} MB</span>
      </div>
    </div>
  );
}
