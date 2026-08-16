import { DetectorApp } from "@/components/detector-app";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-content glass-card">
          <p className="eyebrow">On-device forensics</p>
          <h1>
            Is this media <span className="gradient-text">authentic</span>?
          </h1>
          <p className="hero-lead">
            Drop an image or a video up to one minute. Classifiers, frequency analysis, and provenance
            checks run in your browser. Nothing is uploaded, and there is no account.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#detect">
              Analyse a file
            </a>
            <Link className="btn btn-glass" href="/how-it-works">
              How the ensemble works
            </Link>
          </div>
        </div>
      </section>

      <div className="stat-row">
        <div className="stat-pill">
          <strong>9</strong>
          <span>layered checks</span>
        </div>
        <div className="stat-pill">
          <strong>0</strong>
          <span>uploads</span>
        </div>
        <div className="stat-pill">
          <strong>60s</strong>
          <span>video cap</span>
        </div>
      </div>

      <DetectorApp />

      <section className="section">
        <div className="section-head">
          <p className="eyebrow">Coverage</p>
          <h2>Built to catch families of generators, not a logo list</h2>
          <p className="section-desc">
            Diffusion images, face-swap deepfakes, and short AI video share artefacts even when the
            product name is new. The report votes across independent signals instead of a single API.
          </p>
        </div>
        <div className="topic-grid">
          <article className="topic-card glass-card">
            <p className="tag">Images</p>
            <h3>Diffusion and edits</h3>
            <p>Flux, Midjourney, Firefly, DALL·E, and SDXL-class stills via two image nets plus FFT.</p>
          </article>
          <article className="topic-card glass-card">
            <p className="tag">Faces</p>
            <h3>Deepfake specialist</h3>
            <p>A ViT trained on face swaps, used as one vote rather than the whole verdict.</p>
          </article>
          <article className="topic-card glass-card">
            <p className="tag">Video</p>
            <h3>Sora-class clips</h3>
            <p>Up to twelve sampled frames, temporal jitter, and the same image ensemble on keyframes.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <p className="eyebrow">Stack</p>
          <h2>Quiet technology, shown plainly</h2>
        </div>
        <div className="featured-projects">
          <article className="project-feature glass-card">
            <div className="project-visual visual-ios">
              <span className="visual-label">On device</span>
            </div>
            <div className="project-body">
              <p className="tag">Privacy</p>
              <h3>The file never leaves the tab</h3>
              <p>
                Decode, EXIF, C2PA markers, FFT, and ONNX classifiers run locally. First visit may
                download quantized models from Hugging Face into the browser cache.
              </p>
              <ul className="tech-list">
                <li>Next.js</li>
                <li>Transformers.js</li>
                <li>WebGPU</li>
                <li>Canvas FFT</li>
              </ul>
            </div>
          </article>
          <article className="project-feature glass-card">
            <div className="project-visual visual-ml">
              <span className="visual-label">Ensemble</span>
            </div>
            <div className="project-body">
              <p className="tag">Models</p>
              <h3>Three classifiers, then rules</h3>
              <p>
                Distilled AI-vs-real ViT, an SDXL-oriented detector, and a deepfake ViT. An aggregator
                maps votes plus forensics into Authentic, Likely AI, AI-generated, or Undetermined.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section id="limits" className="section">
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <p className="eyebrow">Limits</p>
          <h2 style={{ margin: "0 0 0.75rem" }}>No detector catches every generator</h2>
          <div className="project-learned">
            New models, heavy social compression, and stripped metadata can produce false confidence.
            This report is a forensic estimate for a portfolio tool — not legal proof.
          </div>
        </div>
      </section>
    </>
  );
}
