"use client";

import { FftHeatmap } from "@/components/fft-heatmap";
import { initialEngines, runScan } from "@/lib/scan";
import type { ScanProgress, ScanReport, Verdict } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,.jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm";

function verdictCopy(verdict: Verdict): {
  answer: string;
  sub: string;
  className: string;
} {
  if (verdict === "authentic") {
    return {
      answer: "Likely genuine",
      sub: "This looks like it came from a real camera, not an AI generator.",
      className: "verdict-banner is-genuine",
    };
  }
  if (verdict === "likely_ai") {
    return {
      answer: "Likely AI-generated",
      sub: "This looks more like synthetic media than camera footage.",
      className: "verdict-banner is-ai",
    };
  }
  if (verdict === "ai_generated") {
    return {
      answer: "AI-generated",
      sub: "The checks strongly indicate this was made by a generative model.",
      className: "verdict-banner is-ai",
    };
  }
  return {
    answer: "Unclear",
    sub: "The signals disagree or are too weak to call this genuine or AI.",
    className: "verdict-banner is-unclear",
  };
}

function pct(value: number | null): string {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}

function statusLabel(status: ScanProgress["status"]) {
  if (status === "running") return "Running";
  if (status === "done") return "Done";
  if (status === "error") return "Failed";
  if (status === "skipped") return "Skipped";
  return "Waiting";
}

export function DetectorApp() {
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [hot, setHot] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [engines, setEngines] = useState<ScanProgress[]>(initialEngines());
  const [report, setReport] = useState<ScanReport | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    if ((busy || report) && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [busy, report]);

  const finished = engines.filter((engine) =>
    ["done", "skipped", "error"].includes(engine.status),
  ).length;
  const percent = Math.round((finished / Math.max(engines.length, 1)) * 100);
  const current = engines.find((engine) => engine.status === "running");

  const votes = useMemo(() => {
    if (!report) return [];
    return [
      { name: "AI vision model", value: report.signals.distilled_vit },
      { name: "Frequency", value: report.signals.fft_anomaly },
      { name: "Noise residual", value: report.signals.noise_anomaly },
      { name: "Temporal", value: report.signals.temporal_anomaly },
    ];
  }, [report]);

  async function handleFile(next: File | undefined) {
    if (!next || busy) return;
    setError(null);
    setReport(null);
    setFile(next);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(next));
    setBusy(true);
    setEngines(initialEngines());
    try {
      const result = await runScan(next, { onProgress: setEngines });
      setReport(result);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not analyse this file.",
      );
    } finally {
      setBusy(false);
    }
  }

  const copy = report ? verdictCopy(report.verdict) : null;

  return (
    <section id="detect" className="section">
      <div
        className={hot ? "dropzone glass-card is-hot" : "dropzone glass-card"}
        onDragOver={(event) => {
          event.preventDefault();
          setHot(true);
        }}
        onDragLeave={() => setHot(false)}
        onDrop={(event) => {
          event.preventDefault();
          setHot(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
        onClick={() => {
          if (!busy) inputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        {preview ? (
          file?.type.startsWith("video/") ? (
            <video className="dropzone-preview" src={preview} muted playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="dropzone-preview" src={preview} alt="Selected media preview" />
          )
        ) : null}
        <p className="eyebrow">File</p>
        <h2 style={{ margin: 0, fontSize: "1.35rem" }}>Drop a file here</h2>
        <p className="section-desc">JPG, PNG, WebP, GIF, MP4, MOV, or WebM</p>
        <span className="btn btn-primary">
          {busy ? "Checking…" : "Choose a file"}
        </span>
      </div>

      {error ? (
        <p className="project-learned" style={{ marginTop: "1rem" }}>
          {error}
        </p>
      ) : null}

      {busy ? (
        <div ref={panelRef} className="glass-card analyse-panel">
          <div className="analyse-head">
            <span className="spinner" aria-hidden="true" />
            <div>
              <p className="eyebrow">In progress</p>
              <h3>Checking if this is genuine or AI-generated</h3>
              <p className="section-desc">
                {current?.detail || current?.label || "Starting checks…"}
              </p>
            </div>
          </div>
          <div className="scan-meter" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${percent}%` }} />
          </div>
          <p className="scan-meter-label">{percent}% complete · {finished} of {engines.length} checks</p>
          <ul className="engine-list">
            {engines.map((engine) => (
              <li key={engine.id}>
                <strong>{engine.label}</strong>
                <span>
                  {statusLabel(engine.status)}
                  {engine.detail ? ` · ${engine.detail}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {report && copy ? (
        <div ref={busy ? undefined : panelRef} className="glass-card result-panel">
          <div className={copy.className}>
            <p className="eyebrow">Result</p>
            <h2>{copy.answer}</h2>
            <p>{copy.sub}</p>
            <p className="verdict-confidence">
              {Math.round(report.confidence * 100)}% confidence
            </p>
          </div>

          <ul className="skill-bars is-in">
            {votes.map((vote) => (
              <li key={vote.name}>
                <span className="skill-name">
                  {vote.name}
                  <span>{pct(vote.value)}</span>
                </span>
                <span className="bar">
                  <span
                    style={{
                      ["--w" as string]:
                        vote.value == null ? 0 : Math.round(vote.value * 100),
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>

          <div className="project-learned" style={{ marginTop: "1.15rem" }}>
            <p className="eyebrow" style={{ marginBottom: "0.4rem" }}>
              Why
            </p>
            <ul className="dot-list">
              {report.explanation.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          {report.heatmap ? (
            <div style={{ marginTop: "1.25rem" }}>
              <p className="eyebrow">Frequency heatmap</p>
              <FftHeatmap data={report.heatmap} />
            </div>
          ) : null}
          {report.frames.length > 1 ? (
            <div style={{ marginTop: "1.25rem" }}>
              <p className="eyebrow">Sampled frames</p>
              <div className="frame-strip">
                {report.frames.map((frame) => (
                  <figure key={frame.time}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={frame.dataUrl} alt={`Frame at ${frame.time.toFixed(1)}s`} />
                    <figcaption>{frame.time.toFixed(1)}s</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
