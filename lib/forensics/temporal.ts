function lumaMean(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 0;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let sum = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  }
  return sum / n;
}

function frameDiff(a: HTMLCanvasElement, b: HTMLCanvasElement): number {
  const ctxA = a.getContext("2d", { willReadFrequently: true });
  const ctxB = b.getContext("2d", { willReadFrequently: true });
  if (!ctxA || !ctxB) return 0;
  const da = ctxA.getImageData(0, 0, a.width, a.height).data;
  const db = ctxB.getImageData(0, 0, b.width, b.height).data;
  let acc = 0;
  const n = da.length / 4;
  for (let i = 0; i < da.length; i += 4) {
    acc +=
      Math.abs(da[i] - db[i]) +
      Math.abs(da[i + 1] - db[i + 1]) +
      Math.abs(da[i + 2] - db[i + 2]);
  }
  return acc / (n * 765);
}

export function analyzeTemporal(canvases: HTMLCanvasElement[]): number {
  if (canvases.length < 3) return 0;
  const diffs: number[] = [];
  for (let i = 1; i < canvases.length; i += 1) {
    diffs.push(frameDiff(canvases[i - 1], canvases[i]));
  }
  const mean = diffs.reduce((s, v) => s + v, 0) / diffs.length;
  const variance =
    diffs.reduce((s, v) => s + (v - mean) ** 2, 0) / diffs.length;
  const std = Math.sqrt(variance);
  const brightness = canvases.map(lumaMean);
  let flicker = 0;
  for (let i = 1; i < brightness.length; i += 1) {
    flicker += Math.abs(brightness[i] - brightness[i - 1]);
  }
  flicker /= brightness.length;

  const tooSmooth = mean < 0.012 ? (0.012 - mean) / 0.012 : 0;
  const unstable = std > 0.08 ? Math.min(1, (std - 0.08) / 0.12) : 0;
  const flickerScore = flicker > 8 ? Math.min(1, (flicker - 8) / 20) : 0;
  return Math.min(1, Math.max(0, tooSmooth * 0.55 + unstable * 0.35 + flickerScore * 0.45));
}
