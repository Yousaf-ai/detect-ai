export type Verdict =
  | "authentic"
  | "likely_ai"
  | "ai_generated"
  | "undetermined";

export type EngineStatus = "pending" | "running" | "done" | "skipped" | "error";

export type EngineId =
  | "validate"
  | "exif"
  | "c2pa"
  | "fft"
  | "noise"
  | "temporal"
  | "distilled"
  | "sdxl"
  | "deepfake";

export type ScanProgress = {
  id: EngineId;
  label: string;
  status: EngineStatus;
  detail?: string;
};

export type SignalMap = {
  distilled_vit: number | null;
  sdxl_detector: number | null;
  deepfake: number | null;
  fft_anomaly: number;
  noise_anomaly: number;
  temporal_anomaly: number | null;
  c2pa: boolean;
  c2pa_generative: boolean;
  generator_exif: boolean;
  camera_exif: boolean;
};

export type FrameScore = {
  time: number;
  dataUrl: string;
  ai: number | null;
};

export type ScanReport = {
  verdict: Verdict;
  confidence: number;
  mediaType: "image" | "video";
  fileName: string;
  signals: SignalMap;
  explanation: string[];
  engines: ScanProgress[];
  generatorHint: string | null;
  cameraHint: string | null;
  heatmap: ImageData | null;
  frames: FrameScore[];
  duration: number | null;
};

export type ScanCallbacks = {
  onProgress: (engines: ScanProgress[]) => void;
};
