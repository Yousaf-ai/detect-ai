import type { ScanProgress } from "@/lib/types";

const GENERATOR_RE =
  /midjourney|dall-?e|dall·e|firefly|stable diffusion|stablediffusion|automatic1111|comfyui|invokeai|novelai|leonardo|nightcafe|runway|pika|luma|kling|sora|chatgpt|openai|gemini|imagen|flux|grok|ideogram|reve|recraft|adobe firefly|generative/i;

const CAMERA_MAKES =
  /canon|nikon|sony|fujifilm|panasonic|olympus|leica|hasselblad|dji|gopro|apple|samsung|google|pixel|oneplus|xiaomi|huawei|motorola|oppo|vivo|lumix|ricoh|pentax/i;

export type ExifSignals = {
  generator: boolean;
  camera: boolean;
  generatorHint: string | null;
  cameraHint: string | null;
};

export async function analyzeExif(file: File): Promise<ExifSignals> {
  try {
    const exifr = (await import("exifr")).default;
    const parsed = (await exifr.parse(file, {
      tiff: true,
      xmp: true,
      icc: false,
      iptc: true,
      gps: false,
    })) as Record<string, unknown> | undefined;

    if (!parsed) {
      return { generator: false, camera: false, generatorHint: null, cameraHint: null };
    }

    const software = String(parsed.Software ?? parsed.CreatorTool ?? parsed.ProcessingSoftware ?? "");
    const make = String(parsed.Make ?? "");
    const model = String(parsed.Model ?? "");
    const blob = `${software} ${make} ${model} ${JSON.stringify(parsed).slice(0, 4000)}`;

    const generator = GENERATOR_RE.test(blob);
    const camera = CAMERA_MAKES.test(make) || CAMERA_MAKES.test(model);
    const generatorHint = generator
      ? software || "Generative software tag in EXIF"
      : null;
    const cameraHint = camera
      ? [make, model].filter(Boolean).join(" ").trim() || null
      : null;

    return { generator, camera, generatorHint, cameraHint };
  } catch {
    return { generator: false, camera: false, generatorHint: null, cameraHint: null };
  }
}

export function mark(
  engines: ScanProgress[],
  id: ScanProgress["id"],
  status: ScanProgress["status"],
  detail?: string,
): ScanProgress[] {
  return engines.map((engine) =>
    engine.id === id ? { ...engine, status, detail } : engine,
  );
}
