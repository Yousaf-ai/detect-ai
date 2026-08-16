"use client";

import { useEffect, useRef } from "react";

export function FftHeatmap({ data }: { data: ImageData }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = data.width;
    canvas.height = data.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(data, 0, 0);
  }, [data]);

  return (
    <canvas
      ref={ref}
      className="heatmap"
      style={{ imageRendering: "pixelated" }}
      aria-label="Frequency spectrogram of the media"
    />
  );
}
