import { DetectorApp } from "@/components/detector-app";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1>
            Is this media <span className="gradient-text">authentic</span>?
          </h1>
          <p className="hero-lead">
            Drop an image or a one-minute video. Checks run in this tab — the file is never uploaded.
          </p>
        </div>
      </section>

      <DetectorApp />

      <section className="section">
        <div className="glass-card method-card">
          <p className="eyebrow">How a scan works</p>
          <ul className="dot-list">
            <li>
              A vision model, frequency analysis, noise residual, and EXIF/C2PA each vote. Video also
              gets a motion check.
            </li>
            <li>
              The first visit may download a detector model into the browser cache. Later scans reuse it.
            </li>
            <li>
              New generators, heavy social compression, and stripped metadata can leave the result
              unclear. This is a forensic estimate, not legal proof.
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
