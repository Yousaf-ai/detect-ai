export const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/jpg",
]);

export const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]);

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 60;

export type MediaKind = "image" | "video";

export function kindFromFile(file: File): MediaKind | null {
  if (IMAGE_TYPES.has(file.type)) return "image";
  if (VIDEO_TYPES.has(file.type)) return "video";
  const name = file.name.toLowerCase();
  if (/\.(jpe?g|png|webp|gif|heic|heif)$/.test(name)) return "image";
  if (/\.(mp4|mov|webm|m4v)$/.test(name)) return "video";
  return null;
}

export function validateFile(file: File): { kind: MediaKind } {
  const kind = kindFromFile(file);
  if (!kind) {
    throw new Error("Use JPG, PNG, WebP, GIF, MP4, MOV, or WebM.");
  }
  if (kind === "image" && file.size > MAX_IMAGE_BYTES) {
    throw new Error("Images must be 20 MB or smaller.");
  }
  if (kind === "video" && file.size > MAX_VIDEO_BYTES) {
    throw new Error("Videos must be 80 MB or smaller.");
  }
  return { kind };
}

export function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(url);
      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error("Could not read the video duration."));
        return;
      }
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This video could not be decoded in the browser."));
    };
    video.src = url;
  });
}
