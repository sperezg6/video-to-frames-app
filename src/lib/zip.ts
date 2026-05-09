"use client";

import JSZip from "jszip";
import type { ExtractedFrame } from "./ffmpeg";

export async function buildZip(frames: ExtractedFrame[]): Promise<Blob> {
  const zip = new JSZip();
  for (const frame of frames) {
    const buf = frame.data.buffer.slice(
      frame.data.byteOffset,
      frame.data.byteOffset + frame.data.byteLength,
    ) as ArrayBuffer;
    zip.file(frame.name, buf);
  }
  return zip.generateAsync({ type: "blob", compression: "STORE" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

export function zipNameFromVideo(videoName: string): string {
  const base = videoName.replace(/\.[^.]+$/, "");
  const safe = base.replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "");
  return `${safe || "video"}_frames.zip`;
}
