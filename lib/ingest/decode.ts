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
  if (!sw || !sh) throw new Error("Could not read this image.");
  const scale = Math.max(size / sw, size / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.drawImage(source, (size - dw) / 2, (size - dh) / 2, dw, dh);
  return canvas;
}

function sourceSize(source: CanvasImageSource): { width: number; height: number } {
  if (source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  if (source instanceof HTMLVideoElement) {
    return { width: source.videoWidth, height: source.videoHeight };
  }
  if ("width" in source && "height" in source) {
    return { width: Number(source.width) || 0, height: Number(source.height) || 0 };
  }
  return { width: 0, height: 0 };
}

function decodeHint(file: File): string {
  const name = file.name.toLowerCase();
  if (/\.(heic|heif)$/.test(name) || /heic|heif/.test(file.type)) {
    return "This photo is HEIC. Export it as JPG or PNG, then try again.";
  }
  if (/\.avif$/.test(name) || file.type === "image/avif") {
    return "This AVIF could not be decoded here. Try JPG or PNG.";
  }
  return "This image could not be read. Try JPG, PNG, or WebP.";
}

async function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("decode"));
    image.src = url;
  });
  await image.decode().catch(() => undefined);
  if (!image.naturalWidth || !image.naturalHeight) {
    throw new Error("decode");
  }
  return image;
}

export async function fileToImageCanvas(
  file: File,
  size = 512,
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  let bitmap: ImageBitmap | undefined;
  const objectUrl = URL.createObjectURL(file);

  try {
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const { width, height } = sourceSize(bitmap);
      return { canvas: coverDraw(bitmap, size, width, height), width, height };
    } catch {
      const image = await loadHtmlImage(objectUrl);
      const { width, height } = sourceSize(image);
      return { canvas: coverDraw(image, size, width, height), width, height };
    }
  } catch {
    throw new Error(decodeHint(file));
  } finally {
    bitmap?.close();
    URL.revokeObjectURL(objectUrl);
  }
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
