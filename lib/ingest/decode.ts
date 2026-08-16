export function coverDraw(
  source: CanvasImageSource,
  size: number,
  sw: number,
  sh: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not available.");
  const scale = Math.max(size / sw, size / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.drawImage(source, (size - dw) / 2, (size - dh) / 2, dw, dh);
  return canvas;
}

export async function fileToImageCanvas(
  file: File,
  size = 512,
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const canvas = coverDraw(bitmap, size, bitmap.width, bitmap.height);
  const width = bitmap.width;
  const height = bitmap.height;
  bitmap.close();
  return { canvas, width, height };
}

export function canvasToImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not available.");
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function imageDataToCanvas(data: ImageData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");
  ctx.putImageData(data, 0, 0);
  return canvas;
}
