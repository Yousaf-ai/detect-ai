import type { ScanReport, SignalMap, Verdict } from "@/lib/types";

function mean(values: Array<number | null>): number | null {
  const nums = values.filter((v): v is number => v != null);
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function aggregate(input: {
  mediaType: "image" | "video";
  fileName: string;
  signals: SignalMap;
  generatorHint: string | null;
  cameraHint: string | null;
  heatmap: ImageData | null;
  frames: ScanReport["frames"];
  duration: number | null;
  engines: ScanReport["engines"];
}): ScanReport {
  const { signals } = input;
  const votes = mean([signals.distilled_vit, signals.sdxl_detector]);
  const deepfake = signals.deepfake ?? 0;
  const fft = signals.fft_anomaly;
  const noise = signals.noise_anomaly;
  const temporal = signals.temporal_anomaly ?? 0;
  const forensic = mean([fft, noise, temporal]) ?? 0;

  let lean = votes ?? forensic;
  if (signals.c2pa_generative || signals.generator_exif) {
    lean = Math.max(lean, 0.82);
  }
  if (signals.camera_exif && !signals.generator_exif) {
    lean = lean * 0.92;
  }

  let verdict: Verdict = "undetermined";
  if (signals.c2pa_generative || (votes != null && votes >= 0.9) || (signals.generator_exif && (votes ?? 0) >= 0.55)) {
    verdict = "ai_generated";
  } else if (
    (votes != null && votes >= 0.75 && (fft >= 0.45 || deepfake >= 0.6)) ||
    deepfake >= 0.85
  ) {
    verdict = "ai_generated";
  } else if (
    (votes != null && votes >= 0.55) ||
    deepfake >= 0.5 ||
    (fft >= 0.55 && (noise >= 0.45 || temporal >= 0.45)) ||
    signals.generator_exif
  ) {
    verdict = "likely_ai";
  } else if (
    (votes != null && votes <= 0.4 && deepfake < 0.35 && !signals.generator_exif) ||
    (votes == null && forensic <= 0.32 && !signals.generator_exif && !signals.c2pa_generative)
  ) {
    verdict = "authentic";
  }

  const confidence =
    verdict === "undetermined"
      ? Math.min(0.62, 0.35 + Math.abs((votes ?? 0.5) - 0.5))
      : Math.min(0.94, 0.52 + Math.abs(lean - 0.5) * 0.9);

  const explanation: string[] = [];
  const loaded = [signals.distilled_vit, signals.sdxl_detector, signals.deepfake].filter((v) => v != null);
  if (loaded.length >= 2) {
    explanation.push(
      `Independent classifiers lean ${(votes ?? 0) >= 0.5 ? "synthetic" : "camera-like"} (${loaded.length} model votes).`,
    );
  } else if (loaded.length === 1) {
    explanation.push("One on-device classifier returned a score; forensics were used to corroborate it.");
  } else {
    explanation.push("Neural classifiers did not load (network or WebGPU). The verdict uses frequency, noise, provenance, and motion checks.");
  }

  if (fft >= 0.45) {
    explanation.push("The frequency spectrum shows periodic high-frequency energy often left by generative upsampling.");
  } else {
    explanation.push("The frequency spectrum is closer to natural 1/f decay than to a strong generative lattice.");
  }

  if (signals.generator_exif && input.generatorHint) {
    explanation.push(`EXIF software points at a generator: ${input.generatorHint}.`);
  } else if (signals.camera_exif && input.cameraHint) {
    explanation.push(`Camera provenance is present (${input.cameraHint}). Missing or stripped EXIF is not treated as proof of AI.`);
  } else {
    explanation.push("No camera EXIF. That is common on social downloads and is not proof by itself.");
  }

  if (signals.c2pa) {
    explanation.push(
      signals.c2pa_generative
        ? "A C2PA-style credential marker suggests generative provenance."
        : "A C2PA-style credential marker is present, but it does not clearly say the asset is generative.",
    );
  }

  if (input.mediaType === "video") {
    if (temporal >= 0.45) {
      explanation.push("Frame-to-frame motion looks unusually smooth or flickery for camera footage.");
    } else {
      explanation.push("Temporal jitter across sampled frames is within a plausible camera range.");
    }
  }

  explanation.push("This is a forensic estimate, not legal proof. New generators and heavy compression can evade models.");

  return {
    ...input,
    verdict,
    confidence,
    explanation,
  };
}
