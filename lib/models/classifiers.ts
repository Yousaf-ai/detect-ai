type ClassifierHit = { label: string; score: number };

type PipelineFn = (input: HTMLCanvasElement) => Promise<ClassifierHit[]>;

const pipes: Record<string, PipelineFn | undefined> = {};

const MODELS = {
  distilled: "onnx-community/ai-image-detect-distilled-ONNX",
  sdxl: "onnx-community/SMOGY-Ai-images-detector-ONNX",
  deepfake: "onnx-community/Deep-Fake-Detector-v2-Model-ONNX",
} as const;

export type ModelId = keyof typeof MODELS;

function aiProbability(results: ClassifierHit[] | undefined): number | null {
  if (!results?.length) return null;
  const ai = results.find((r) =>
    /fake|ai|artificial|generated|synthetic|deepfake/i.test(r.label),
  );
  const real = results.find((r) =>
    /real|authentic|human|natural|live|realism/i.test(r.label),
  );
  if (ai && real) return ai.score / (ai.score + real.score);
  if (ai) return ai.score;
  if (real) return 1 - real.score;
  return results[0]?.score ?? null;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timed out")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function loadPipeline(
  id: ModelId,
  onStatus?: (detail: string) => void,
): Promise<PipelineFn | null> {
  if (pipes[id]) return pipes[id] as PipelineFn;

  try {
    const { pipeline, env, RawImage } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    onStatus?.("Downloading detector model (first visit only)…");
    const loaded = await withTimeout(
      pipeline("image-classification", MODELS[id], {
        device: "wasm",
        dtype: "q8",
        progress_callback: (info) => {
          if (info.status === "progress" && typeof info.progress === "number") {
            onStatus?.(
              `Downloading model ${Math.min(100, Math.round(info.progress))}%`,
            );
          }
          if (info.status === "ready") onStatus?.("Running detector…");
        },
      }),
      90_000,
    );

    const run: PipelineFn = async (canvas) => {
      const image = RawImage.fromCanvas(canvas);
      const out = (await loaded(image, { top_k: 5 })) as ClassifierHit[];
      return Array.isArray(out) ? out : [];
    };
    pipes[id] = run;
    return run;
  } catch {
    return null;
  }
}

export async function classifyCanvas(
  id: ModelId,
  canvas: HTMLCanvasElement,
  onStatus?: (detail: string) => void,
): Promise<number | null> {
  const run = await loadPipeline(id, onStatus);
  if (!run) return null;
  try {
    onStatus?.("Scoring the image…");
    const results = await withTimeout(run(canvas), 20_000);
    return aiProbability(results);
  } catch {
    return null;
  }
}

export async function classifyFrames(
  id: ModelId,
  canvases: HTMLCanvasElement[],
  onStatus?: (detail: string) => void,
): Promise<number | null> {
  const scores: number[] = [];
  const sample =
    canvases.length <= 3
      ? canvases
      : [canvases[0], canvases[Math.floor(canvases.length / 2)], canvases[canvases.length - 1]];
  for (let i = 0; i < sample.length; i++) {
    onStatus?.(`Scoring frame ${i + 1} of ${sample.length}…`);
    const score = await classifyCanvas(id, sample[i], onStatus);
    if (score != null) scores.push(score);
  }
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
