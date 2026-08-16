function fft1d(real: Float64Array, imag: Float64Array) {
  const n = real.length;
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = real[i];
      real[i] = real[j];
      real[j] = tr;
      const ti = imag[i];
      imag[i] = imag[j];
      imag[j] = ti;
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wlenRe = Math.cos(ang);
    const wlenIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      for (let j = 0; j < len / 2; j += 1) {
        const uRe = real[i + j];
        const uIm = imag[i + j];
        const vRe = real[i + j + len / 2] * wRe - imag[i + j + len / 2] * wIm;
        const vIm = real[i + j + len / 2] * wIm + imag[i + j + len / 2] * wRe;
        real[i + j] = uRe + vRe;
        imag[i + j] = uIm + vIm;
        real[i + j + len / 2] = uRe - vRe;
        imag[i + j + len / 2] = uIm - vIm;
        const nWRe = wRe * wlenRe - wIm * wlenIm;
        wIm = wRe * wlenIm + wIm * wlenRe;
        wRe = nWRe;
      }
    }
  }
}

function luma(data: ImageData): Float64Array {
  const n = data.width * data.height;
  const out = new Float64Array(n);
  const px = data.data;
  for (let i = 0; i < n; i += 1) {
    const o = i * 4;
    out[i] = (0.2126 * px[o] + 0.7152 * px[o + 1] + 0.0722 * px[o + 2]) / 255;
  }
  return out;
}

export type FftResult = {
  score: number;
  heatmap: ImageData;
};

export function analyzeFft(image: ImageData): FftResult {
  const size = image.width;
  const src = luma(image);
  const real = new Float64Array(size * size);
  const imag = new Float64Array(size * size);

  for (let y = 0; y < size; y += 1) {
    const wy = 0.5 * (1 - Math.cos((2 * Math.PI * y) / (size - 1)));
    for (let x = 0; x < size; x += 1) {
      const wx = 0.5 * (1 - Math.cos((2 * Math.PI * x) / (size - 1)));
      real[y * size + x] = src[y * size + x] * wx * wy;
    }
  }

  const rowR = new Float64Array(size);
  const rowI = new Float64Array(size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      rowR[x] = real[y * size + x];
      rowI[x] = imag[y * size + x];
    }
    fft1d(rowR, rowI);
    for (let x = 0; x < size; x += 1) {
      real[y * size + x] = rowR[x];
      imag[y * size + x] = rowI[x];
    }
  }

  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) {
      rowR[y] = real[y * size + x];
      rowI[y] = imag[y * size + x];
    }
    fft1d(rowR, rowI);
    for (let y = 0; y < size; y += 1) {
      real[y * size + x] = rowR[y];
      imag[y * size + x] = rowI[y];
    }
  }

  const mag = new Float64Array(size * size);
  let maxLog = 0;
  for (let i = 0; i < mag.length; i += 1) {
    mag[i] = Math.log1p(Math.hypot(real[i], imag[i]));
    if (mag[i] > maxLog) maxLog = mag[i];
  }

  const half = size / 2;
  const heatmap = new ImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sy = (y + half) % size;
      const sx = (x + half) % size;
      const v = maxLog > 0 ? mag[sy * size + sx] / maxLog : 0;
      const i = (y * size + x) * 4;
      heatmap.data[i] = Math.round(255 - v * 90);
      heatmap.data[i + 1] = Math.round(255 - v * 40);
      heatmap.data[i + 2] = 255;
      heatmap.data[i + 3] = 255;
    }
  }

  const rings = 8;
  const energy = new Array(rings).fill(0);
  const counts = new Array(rings).fill(0);
  const cx = half;
  const cy = half;
  const maxR = Math.hypot(cx, cy);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sy = (y + half) % size;
      const sx = (x + half) % size;
      const r = Math.hypot(x - cx, y - cy) / maxR;
      const band = Math.min(rings - 1, Math.floor(r * rings));
      energy[band] += mag[sy * size + sx];
      counts[band] += 1;
    }
  }
  const mean = energy.map((e, i) => (counts[i] ? e / counts[i] : 0));
  const low = (mean[1] + mean[2]) / 2 || 1;
  const high = (mean[5] + mean[6] + mean[7]) / 3;
  const decay = high / low;
  const peakiness = mean[4] / ((mean[3] + mean[5]) / 2 || 1);

  const score = Math.min(1, Math.max(0, (decay - 0.18) * 1.7 + (peakiness - 1) * 0.45));
  return { score, heatmap };
}
