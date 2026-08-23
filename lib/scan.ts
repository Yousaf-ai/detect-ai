import { analyzeC2pa } from "@/lib/forensics/c2pa";
import { analyzeExif, mark } from "@/lib/forensics/exif";
import { analyzeFft } from "@/lib/forensics/fft";
import { analyzeNoise } from "@/lib/forensics/noise";
import { analyzeTemporal } from "@/lib/forensics/temporal";
import { canvasToImageData, fileToImageCanvas } from "@/lib/ingest/decode";
import { sampleVideoFrames } from "@/lib/ingest/frames";
import { validateFile } from "@/lib/ingest/validate";
import { classifyCanvas, classifyFrames } from "@/lib/models/classifiers";
import { aggregate } from "@/lib/score";
import type { ScanCallbacks, ScanProgress, ScanReport, SignalMap } from "@/lib/types";

const INITIAL: ScanProgress[] = [
  { id: "validate", label: "File checks", status: "pending" },
  { id: "exif", label: "EXIF provenance", status: "pending" },
  { id: "c2pa", label: "C2PA credentials", status: "pending" },
  { id: "fft", label: "Frequency forensics", status: "pending" },
  { id: "noise", label: "Noise residual", status: "pending" },
  { id: "temporal", label: "Temporal consistency", status: "pending" },
  { id: "distilled", label: "AI vision model", status: "pending" },
];

export function initialEngines(): ScanProgress[] {
  return INITIAL.map((engine) => ({ ...engine }));
}

function yieldUi() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export async function runScan(file: File, callbacks: ScanCallbacks): Promise<ScanReport> {
  let engines = initialEngines();
  const emit = (next: ScanProgress[]) => {
    engines = next;
    callbacks.onProgress(engines);
  };

  emit(mark(engines, "validate", "running"));
  await yieldUi();
  const { kind } = validateFile(file);

  let duration: number | null = null;
  let analysisCanvas: HTMLCanvasElement;
  let frames: ScanReport["frames"] = [];
  let frameCanvases: HTMLCanvasElement[] = [];

  if (kind === "video") {
    const sampled = await sampleVideoFrames(file, 8, 256);
    duration = sampled.duration;
    frames = sampled.frames.map((frame) => ({
      time: frame.time,
      dataUrl: frame.dataUrl,
      ai: null,
    }));
    frameCanvases = sampled.frames.map((frame) => frame.canvas);
    analysisCanvas = frameCanvases[Math.floor(frameCanvases.length / 2)] ?? frameCanvases[0];
  } else {
    const decoded = await fileToImageCanvas(file, 256);
    analysisCanvas = decoded.canvas;
  }

  emit(mark(engines, "validate", "done", kind === "video" ? `${Math.round(duration ?? 0)}s clip` : "Image"));
  await yieldUi();

  emit(mark(engines, "exif", "running"));
  const exif = await analyzeExif(file);
  emit(
    mark(engines, "exif", "done", exif.generatorHint || exif.cameraHint || "No camera tags"),
  );
  await yieldUi();

  emit(mark(engines, "c2pa", "running"));
  const c2pa = await analyzeC2pa(file);
  emit(mark(engines, "c2pa", "done", c2pa.present ? "Marker found" : "None found"));
  await yieldUi();

  emit(mark(engines, "fft", "running"));
  const fftSize = document.createElement("canvas");
  fftSize.width = 128;
  fftSize.height = 128;
  const fftCtx = fftSize.getContext("2d", { willReadFrequently: true });
  if (!fftCtx) throw new Error("Canvas is not available.");
  fftCtx.drawImage(analysisCanvas, 0, 0, 128, 128);
  const fft = analyzeFft(fftCtx.getImageData(0, 0, 128, 128));
  emit(mark(engines, "fft", "done"));
  await yieldUi();

  emit(mark(engines, "noise", "running"));
  const noise = analyzeNoise(canvasToImageData(analysisCanvas));
  emit(mark(engines, "noise", "done"));
  await yieldUi();

  let temporal: number | null = null;
  if (kind === "video") {
    emit(mark(engines, "temporal", "running"));
    temporal = analyzeTemporal(frameCanvases);
    emit(mark(engines, "temporal", "done"));
  } else {
    emit(mark(engines, "temporal", "skipped", "Not needed for stills"));
  }
  await yieldUi();

  emit(mark(engines, "distilled", "running", "Loading detector…"));
  const distilled =
    kind === "video"
      ? await classifyFrames("distilled", frameCanvases, (detail) =>
          emit(mark(engines, "distilled", "running", detail)),
        )
      : await classifyCanvas("distilled", analysisCanvas, (detail) =>
          emit(mark(engines, "distilled", "running", detail)),
        );
  emit(
    mark(
      engines,
      "distilled",
      distilled == null ? "error" : "done",
      distilled == null ? "Model unavailable — using forensics" : `${Math.round(distilled * 100)}% AI`,
    ),
  );

  if (kind === "video" && distilled != null) {
    frames = frames.map((frame) => ({ ...frame, ai: distilled }));
  }

  const signals: SignalMap = {
    distilled_vit: distilled,
    sdxl_detector: null,
    deepfake: null,
    fft_anomaly: fft.score,
    noise_anomaly: noise,
    temporal_anomaly: temporal,
    c2pa: c2pa.present,
    c2pa_generative: c2pa.generative,
    generator_exif: exif.generator,
    camera_exif: exif.camera,
  };

  return aggregate({
    mediaType: kind,
    fileName: file.name,
    signals,
    generatorHint: exif.generatorHint,
    cameraHint: exif.cameraHint,
    heatmap: fft.heatmap,
    frames,
    duration,
    engines,
  });
}
