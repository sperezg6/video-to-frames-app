"use client";

export type VideoMeta = {
  duration: number;
  width: number;
  height: number;
};

export function probeVideo(file: File): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      v.removeAttribute("src");
      v.load();
    };

    v.onloadedmetadata = () => {
      const meta: VideoMeta = {
        duration: v.duration,
        width: v.videoWidth,
        height: v.videoHeight,
      };
      cleanup();
      if (!Number.isFinite(meta.duration) || meta.duration <= 0) {
        reject(new Error("Could not read video duration"));
      } else {
        resolve(meta);
      }
    };
    v.onerror = () => {
      cleanup();
      reject(new Error("Failed to load video metadata"));
    };
  });
}

export function formatClock(seconds: number): string {
  const total = Math.max(0, seconds);
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function estimateFrameCount(
  durationSec: number,
  mode: { kind: "every" } | { kind: "fps"; value: number } | { kind: "interval"; seconds: number },
  assumedFps = 30,
): number {
  switch (mode.kind) {
    case "every":
      return Math.round(durationSec * assumedFps);
    case "fps":
      return Math.max(1, Math.round(durationSec * mode.value));
    case "interval":
      return Math.max(1, Math.floor(durationSec / mode.seconds) + 1);
  }
}
