"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TopNav } from "@/components/chrome/TopNav";
import { ButtonPill } from "@/components/primitives/ButtonPill";
import { Dropzone } from "@/components/extractor/Dropzone";
import { SettingsPanel } from "@/components/extractor/SettingsPanel";
import { ProgressView } from "@/components/extractor/ProgressView";
import { ThumbnailGrid } from "@/components/extractor/ThumbnailGrid";
import { VideoPreview } from "@/components/extractor/VideoPreview";
import { RangeSlider } from "@/components/extractor/RangeSlider";
import TextRoll from "@/components/ui/text-roll";
import type { ExtractedFrame, ExtractionMode } from "@/lib/ffmpeg";
import { estimateFrameCount, probeVideo } from "@/lib/video";

type Status =
  | { kind: "idle" }
  | { kind: "fileReady"; file: File; duration: number }
  | {
      kind: "extracting";
      file: File;
      duration: number;
      progress: number;
      time: number;
    }
  | {
      kind: "done";
      file: File;
      duration: number;
      frames: ExtractedFrame[];
      zipName: string;
    }
  | { kind: "error"; message: string };

const HEAVY_FRAME_THRESHOLD = 1500;
const APPROX_PNG_KB = 200;

export default function Home() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [mode, setMode] = useState<ExtractionMode>({ kind: "fps", value: 1 });
  const [range, setRange] = useState<{ start: number; end: number } | null>(null);
  const [scrub, setScrub] = useState<number | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus({ kind: "idle" });
    setRange(null);
    setScrub(undefined);
  }, []);

  const onFile = useCallback(async (file: File) => {
    try {
      const meta = await probeVideo(file);
      setStatus({ kind: "fileReady", file, duration: meta.duration });
      setRange({ start: 0, end: meta.duration });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Could not read this file.",
      });
    }
  }, []);

  const effectiveDuration =
    status.kind === "fileReady" || status.kind === "extracting" || status.kind === "done"
      ? status.duration
      : 0;
  const effectiveRange = range ?? { start: 0, end: effectiveDuration };
  const trimmedDuration = Math.max(0, effectiveRange.end - effectiveRange.start);

  const estimate = useMemo(() => {
    if (trimmedDuration <= 0) return null;
    const count = estimateFrameCount(trimmedDuration, mode);
    const sizeMB = (count * APPROX_PNG_KB) / 1024;
    return { count, sizeMB };
  }, [trimmedDuration, mode]);

  const onExtract = useCallback(async () => {
    if (status.kind !== "fileReady") return;
    const file = status.file;
    const duration = status.duration;
    const ac = new AbortController();
    abortRef.current = ac;
    setStatus({ kind: "extracting", file, duration, progress: 0, time: 0 });
    try {
      const { extractFrames } = await import("@/lib/ffmpeg");
      const frames = await extractFrames(
        file,
        { mode, range: effectiveRange, signal: ac.signal },
        ({ progress, time }) => {
          setStatus((s) =>
            s.kind === "extracting" ? { ...s, progress, time } : s,
          );
        },
      );
      if (ac.signal.aborted) {
        // Aborted — return to fileReady state silently
        setStatus({ kind: "fileReady", file, duration });
        return;
      }
      if (frames.length === 0) {
        setStatus({
          kind: "error",
          message: "No frames were extracted. Try a different rate or range.",
        });
        return;
      }
      const { zipNameFromVideo } = await import("@/lib/zip");
      setStatus({
        kind: "done",
        file,
        duration,
        frames,
        zipName: zipNameFromVideo(file.name),
      });
    } catch (err) {
      if (ac.signal.aborted) {
        setStatus({ kind: "fileReady", file, duration });
        return;
      }
      console.error(err);
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Extraction failed.",
      });
    } finally {
      if (abortRef.current === ac) abortRef.current = null;
    }
  }, [status, mode, effectiveRange]);

  const onCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const onDownload = useCallback(async () => {
    if (status.kind !== "done") return;
    const safeName = status.zipName.endsWith(".zip")
      ? status.zipName
      : `${status.zipName}.zip`;
    const { buildZip, downloadBlob } = await import("@/lib/zip");
    const blob = await buildZip(status.frames);
    downloadBlob(blob, safeName);
  }, [status]);

  const setZipName = useCallback((name: string) => {
    setStatus((s) => (s.kind === "done" ? { ...s, zipName: name } : s));
  }, []);

  const showBack = status.kind !== "idle";

  return (
    <>
      <TopNav onBack={showBack ? reset : undefined} />
      <div className="flex-1 flex flex-col items-center px-6 md:px-10 pt-24 md:pt-32 pb-12">
        <div className="w-full max-w-3xl flex flex-col gap-10 md:gap-14">
          <Hero status={status} />

          <AnimatePresence mode="wait">
            {status.kind === "idle" ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Dropzone onFile={onFile} />
              </motion.div>
            ) : null}

            {status.kind === "fileReady" && range ? (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-8"
              >
                <VideoPreview
                  file={status.file}
                  duration={status.duration}
                  scrubTo={scrub}
                />
                <RangeSlider
                  duration={status.duration}
                  start={range.start}
                  end={range.end}
                  onChange={setRange}
                  onScrub={setScrub}
                />
                <SettingsPanel mode={mode} onChange={setMode} />
                {estimate ? (
                  <EstimateRow
                    count={estimate.count}
                    sizeMB={estimate.sizeMB}
                    isEvery={mode.kind === "every"}
                  />
                ) : null}
                <div className="flex flex-wrap items-center gap-3">
                  <ButtonPill tone="dark" onClick={onExtract}>
                    Extract frames
                    <span className="inline-block transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1">
                      →
                    </span>
                  </ButtonPill>
                </div>
              </motion.div>
            ) : null}

            {status.kind === "extracting" ? (
              <motion.div
                key="extracting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <ProgressView progress={status.progress} time={status.time} />
                <p className="text-serif-italic text-mute">
                  Frames are rendering inside your browser. Don&apos;t close the tab.
                </p>
                <div>
                  <ButtonPill onClick={onCancel}>Cancel</ButtonPill>
                </div>
              </motion.div>
            ) : null}

            {status.kind === "done" ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-8"
              >
                <ThumbnailGrid frames={status.frames} />
                <ZipNameRow value={status.zipName} onChange={setZipName} />
                <div className="flex flex-wrap items-center gap-3">
                  <ButtonPill tone="dark" onClick={onDownload}>
                    Download {status.zipName.endsWith(".zip") ? status.zipName : `${status.zipName}.zip`}
                    <span className="inline-block transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-1">
                      ↓
                    </span>
                  </ButtonPill>
                </div>
              </motion.div>
            ) : null}

            {status.kind === "error" ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                <p className="text-display text-[18px]">Something went wrong</p>
                <p className="text-serif-italic text-mute">{status.message}</p>
                <div>
                  <ButtonPill onClick={reset}>Try again</ButtonPill>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

function Hero({ status }: { status: Status }) {
  const heading =
    status.kind === "done"
      ? "Done."
      : status.kind === "extracting"
        ? "Hold on."
        : status.kind === "error"
          ? "Hmm."
          : "Frames.";
  const tagline =
    status.kind === "done"
      ? "Every frame, ready to download."
      : status.kind === "extracting"
        ? "Slicing your video into still images."
        : status.kind === "error"
          ? "Let's try that again."
          : "Drop a video. Pick a rate. Get a zip of frames.";

  return (
    <div className="flex flex-col gap-3">
      <motion.h1
        key={heading}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-display text-[clamp(3rem,9vw,6rem)] cursor-default w-fit"
      >
        <TextRoll>{heading}</TextRoll>
      </motion.h1>
      <motion.p
        key={tagline}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="text-serif-italic text-[clamp(1.1rem,2vw,1.4rem)] text-mute max-w-xl"
      >
        {tagline}
      </motion.p>
    </div>
  );
}

function EstimateRow({
  count,
  sizeMB,
  isEvery,
}: {
  count: number;
  sizeMB: number;
  isEvery: boolean;
}) {
  const heavy = count > HEAVY_FRAME_THRESHOLD;
  return (
    <div
      className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 rounded-xl border tabular-nums"
      style={{
        borderColor: heavy ? "var(--ink)" : "var(--line)",
        background: heavy ? "rgba(10,10,10,0.04)" : "transparent",
      }}
    >
      <span className="text-overline text-mute">Estimate</span>
      <span className="text-display text-[15px]">
        {isEvery ? "≈" : ""}
        {count.toLocaleString()} frames{" "}
        <span className="text-mute">· ≈ {sizeMB.toFixed(0)} MB</span>
      </span>
      {heavy ? (
        <span className="basis-full text-serif-italic text-[13px] text-mute">
          Heads up — large jobs may slow your browser. Consider a lower rate or a tighter trim.
        </span>
      ) : null}
    </div>
  );
}

function ZipNameRow({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // strip .zip from the editable portion so the user edits just the basename
  const base = value.replace(/\.zip$/i, "");
  const [local, setLocal] = useState(base);

  // sync when an upstream change comes in (e.g. reset)
  useEffect(() => {
    setLocal(base);
  }, [base]);

  return (
    <label className="flex flex-col gap-2">
      <span className="text-overline text-mute">Zip filename</span>
      <div className="flex items-stretch rounded-xl border border-line overflow-hidden focus-within:border-ink transition-colors">
        <input
          type="text"
          value={local}
          onChange={(e) => {
            const next = e.target.value;
            setLocal(next);
            onChange(next);
          }}
          className="flex-1 bg-transparent px-4 py-3 text-display text-[15px] focus:outline-none"
          placeholder="my-video_frames"
          spellCheck={false}
        />
        <span className="px-4 py-3 text-display text-[15px] text-mute border-l border-line">
          .zip
        </span>
      </div>
    </label>
  );
}
