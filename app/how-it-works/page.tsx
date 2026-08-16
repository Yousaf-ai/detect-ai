export const metadata = {
  title: "How it works — Detect AI",
  description: "The on-device ensemble behind Detect AI: classifiers, frequency forensics, provenance, and honest limits.",
};

export default function HowItWorksPage() {
  return (
    <>
      <section className="page-hero glass-card">
        <p className="eyebrow">Method</p>
        <h1>
          An ensemble, not a <span className="gradient-text">black box</span>
        </h1>
        <p className="page-lead">
          Detection runs entirely in the browser. Each engine is independent. Disagreement is shown,
          not hidden. Files are decoded in memory and never posted to a server.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <p className="eyebrow">Pipeline</p>
          <h2>Ingest, workers, aggregator</h2>
        </div>
        <div className="featured-projects">
          <article className="project-feature glass-card">
            <div className="project-visual visual-ios">
              <span className="visual-label">Ingest</span>
            </div>
            <div className="project-body">
              <h3>Validate, then sample</h3>
              <p>
                MIME, size, and a 60-second video cap are checked before analysis. Images are centre-cropped
                to a working canvas. Videos yield about ten keyframes.
              </p>
            </div>
          </article>
          <article className="project-feature glass-card">
            <div className="project-visual visual-ml">
              <span className="visual-label">Models</span>
            </div>
            <div className="project-body">
              <h3>Three ONNX classifiers</h3>
              <p>
                A distilled AI-vs-real ViT, an SDXL-oriented Reddit-trained net, and a face-swap deepfake
                ViT. WebGPU is used when the browser allows it; otherwise quantized WASM.
              </p>
              <ul className="tech-list">
                <li>ai-image-detect-distilled</li>
                <li>SMOGY SDXL detector</li>
                <li>Deep-Fake-Detector-v2</li>
              </ul>
            </div>
          </article>
          <article className="project-feature glass-card">
            <div className="project-visual visual-db">
              <span className="visual-label">Forensics</span>
            </div>
            <div className="project-body">
              <h3>Generator-agnostic signals</h3>
              <p>
                2D FFT on luma, Laplacian noise residual, temporal MAD across frames, EXIF software vs
                camera make, and a lightweight C2PA marker scan.
              </p>
            </div>
          </article>
          <article className="project-feature glass-card">
            <div className="project-visual visual-shop">
              <span className="visual-label">Rules</span>
            </div>
            <div className="project-body">
              <h3>A readable verdict</h3>
              <p>
                Missing EXIF never proves authenticity. Generator tags and C2PA generative hints only
                strengthen an AI lean. Model disagreement becomes Undetermined.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section id="limits" className="section">
        <div className="section-head">
          <p className="eyebrow">Honesty</p>
          <h2>What this will not claim</h2>
        </div>
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <ul className="dot-list">
            <li>Brand-new generators can look like camera footage to last year’s weights.</li>
            <li>Watermarks such as SynthID only fire on vendor-marked assets, so they are not a v1 dependency.</li>
            <li>Heavy compression on TikTok-style codecs weakens both nets and FFT.</li>
            <li>This is not a legal evidence pack, a live meeting overlay, or a paid API gateway.</li>
          </ul>
          <p className="project-learned" style={{ marginTop: "1rem" }}>
            Public tool — no login, no scan history, no cloud GPU bill.
          </p>
        </div>
      </section>
    </>
  );
}
