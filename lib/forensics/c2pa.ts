function hasAscii(bytes: Uint8Array, needle: string): boolean {
  const n = needle.length;
  for (let i = 0; i <= bytes.length - n; i += 1) {
    let ok = true;
    for (let j = 0; j < n; j += 1) {
      if (bytes[i + j] !== needle.charCodeAt(j)) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

export type C2paSignals = {
  present: boolean;
  generative: boolean;
};

export async function analyzeC2pa(file: File): Promise<C2paSignals> {
  const slice = file.slice(0, Math.min(file.size, 2_500_000));
  const bytes = new Uint8Array(await slice.arrayBuffer());
  const present =
    hasAscii(bytes, "c2pa") ||
    hasAscii(bytes, "jumb") ||
    hasAscii(bytes, "c2ma") ||
    hasAscii(bytes, "cai.j");
  if (!present) return { present: false, generative: false };

  const text = new TextDecoder("latin1").decode(bytes);
  const generative =
    /generative|ai generated|artificial intelligence|stable diffusion|midjourney|firefly|synthid|dall-e|openai/i.test(
      text,
    );
  return { present: true, generative };
}
