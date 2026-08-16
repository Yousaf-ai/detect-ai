import { coverDraw } from "@/lib/ingest/decode";
import { MAX_VIDEO_SECONDS } from "@/lib/ingest/validate";

export type SampledFrame = {
  time: number;
  canvas: HTMLCanvasElement;
  dataUrl: string;
};

function waitForSeek(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Could not sample a video frame."));
    };
    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = Math.min(Math.max(time, 0), Math.max(video.duration - 0.05, 0));
  });
}

export async function sampleVideoFrames(
  file: File,
  count = 10,
  size = 256,
): Promise<{ frames: SampledFrame[]; duration: number; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("This video could not be decoded in the browser."));
      video.src = url;
    });

    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("Could not read the video duration.");
    }
    if (duration > MAX_VIDEO_SECONDS + 0.05) {
      throw new Error("Videos must be 1 minute or shorter.");
    }

    const width = video.videoWidth || 1;
    const height = video.videoHeight || 1;
    const n = Math.max(3, Math.min(count, Math.floor(duration) + 1));
    const frames: SampledFrame[] = [];

    for (let i = 0; i < n; i += 1) {
      const t = ((i + 0.5) / n) * duration;
      await waitForSeek(video, t);
      const canvas = coverDraw(video, size, width, height);
      frames.push({
        time: t,
        canvas,
        dataUrl: canvas.toDataURL("image/jpeg", 0.72),
      });
    }

    return { frames, duration, width, height };
  } finally {
    URL.revokeObjectURL(url);
    video.src = "";
    video.load();
  }
}
