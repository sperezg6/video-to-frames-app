"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const CORE_VERSION = "0.12.10";
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

let _ffmpeg: FFmpeg | null = null;
let _loaded: Promise<FFmpeg> | null = null;

export type ExtractionMode =
  | { kind: "every" }
  | { kind: "fps"; value: number }
  | { kind: "interval"; seconds: number };

export type TimeRange = { start: number; end: number };

export type ExtractedFrame = {
  /** Display name with timestamp (e.g. frame_00m12s345.png) */
  name: string;
  data: Uint8Array;
};

export type ExtractProgress = {
  progress: number;
  time: number;
};

export class ExtractionAbortedError extends Error {
  constructor() {
    super("Extraction aborted");
    this.name = "ExtractionAbortedError";
  }
}

async function getFFmpeg(): Promise<FFmpeg> {
  if (_loaded) return _loaded;
  _loaded = (async () => {
    const ffmpeg = new FFmpeg();
    const [coreURL, wasmURL] = await Promise.all([
      toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    ]);
    await ffmpeg.load({ coreURL, wasmURL });
    _ffmpeg = ffmpeg;
    return ffmpeg;
  })();
  return _loaded;
}

function modeToFilter(mode: ExtractionMode): string[] {
  switch (mode.kind) {
    case "every":
      return ["-vsync", "0"];
    case "fps":
      return ["-vf", `fps=${mode.value}`];
    case "interval":
      return ["-vf", `fps=1/${mode.seconds}`];
  }
}

function formatTimestamp(seconds: number): string {
  const total = Math.max(0, seconds);
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  const ms = Math.floor((total - Math.floor(total)) * 1000);
  return `${String(m).padStart(2, "0")}m${String(s).padStart(2, "0")}s${String(ms).padStart(3, "0")}`;
}

function frameTimeFor(
  index1: number,
  mode: ExtractionMode,
  startSec: number,
): number | null {
  switch (mode.kind) {
    case "fps":
      return startSec + (index1 - 1) / mode.value;
    case "interval":
      return startSec + (index1 - 1) * mode.seconds;
    case "every":
      return null;
  }
}

export type ExtractOptions = {
  mode: ExtractionMode;
  range?: TimeRange;
  signal?: AbortSignal;
};

export async function extractFrames(
  file: File,
  opts: ExtractOptions,
  onProgress?: (p: ExtractProgress) => void,
): Promise<ExtractedFrame[]> {
  const ffmpeg = await getFFmpeg();
  if (opts.signal?.aborted) throw new ExtractionAbortedError();

  const inputName = "input" + (file.name.match(/\.[^.]+$/)?.[0] ?? ".mp4");
  const pattern = "frame_%05d.png";
  const startSec = opts.range?.start ?? 0;

  const handleProgress = ({ progress, time }: { progress: number; time: number }) => {
    onProgress?.({ progress, time: time / 1_000_000 });
  };
  ffmpeg.on("progress", handleProgress);

  const onAbort = () => {
    try {
      ffmpeg.terminate();
    } catch {
      /* ignore */
    }
    _ffmpeg = null;
    _loaded = null;
  };
  opts.signal?.addEventListener("abort", onAbort, { once: true });

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    if (opts.signal?.aborted) throw new ExtractionAbortedError();

    const trimArgs: string[] = [];
    if (opts.range) {
      trimArgs.push("-ss", String(opts.range.start));
      trimArgs.push("-to", String(opts.range.end));
    }

    const args = [
      ...trimArgs,
      "-i",
      inputName,
      ...modeToFilter(opts.mode),
      pattern,
    ];
    const code = await ffmpeg.exec(args);
    if (opts.signal?.aborted) throw new ExtractionAbortedError();
    if (code !== 0) throw new Error(`ffmpeg exited with code ${code}`);

    const entries = await ffmpeg.listDir("/");
    const frameNames = entries
      .filter((e) => !e.isDir && /^frame_\d+\.png$/.test(e.name))
      .map((e) => e.name)
      .sort();

    const frames: ExtractedFrame[] = [];
    for (let i = 0; i < frameNames.length; i++) {
      const internal = frameNames[i];
      const data = (await ffmpeg.readFile(internal)) as Uint8Array;
      const t = frameTimeFor(i + 1, opts.mode, startSec);
      const stamped =
        t !== null
          ? `frame_${formatTimestamp(t)}.png`
          : `frame_${String(i + 1).padStart(5, "0")}.png`;
      frames.push({ name: stamped, data });
    }

    await Promise.allSettled([
      ffmpeg.deleteFile(inputName),
      ...frameNames.map((n) => ffmpeg.deleteFile(n)),
    ]);

    return frames;
  } finally {
    ffmpeg.off("progress", handleProgress);
    opts.signal?.removeEventListener("abort", onAbort);
  }
}

export function disposeFFmpeg() {
  if (_ffmpeg) {
    try {
      _ffmpeg.terminate();
    } catch {
      /* ignore */
    }
    _ffmpeg = null;
    _loaded = null;
  }
}
