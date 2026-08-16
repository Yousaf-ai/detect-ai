function lumaAt(data: ImageData, x: number, y: number): number {
  const i = (y * data.width + x) * 4;
  return 0.2126 * data.data[i] + 0.7152 * data.data[i + 1] + 0.0722 * data.data[i + 2];
}

export function analyzeNoise(image: ImageData): number {
  const w = image.width;
  const h = image.height;
  const residual: number[] = [];
  let sum = 0;
  let sumSq = 0;

  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const lap =
        lumaAt(image, x, y) * 4 -
        lumaAt(image, x - 1, y) -
        lumaAt(image, x + 1, y) -
        lumaAt(image, x, y - 1) -
        lumaAt(image, x, y + 1);
      residual.push(lap);
      sum += lap;
      sumSq += lap * lap;
    }
  }

  const n = residual.length || 1;
  const mean = sum / n;
  const variance = Math.max(sumSq / n - mean * mean, 1e-6);
  const std = Math.sqrt(variance);

  let ac = 0;
  let acCount = 0;
  const lag = 8;
  for (let i = 0; i < residual.length - lag; i += 1) {
    ac += (residual[i] - mean) * (residual[i + lag] - mean);
    acCount += 1;
  }
  const corr = Math.abs(ac / ((acCount || 1) * variance));
  const tooClean = std < 4.5 ? (4.5 - std) / 4.5 : 0;
  return Math.min(1, Math.max(0, tooClean * 0.55 + corr * 0.9));
}
