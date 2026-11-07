"use client";

import { useEffect, useState } from "react";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
      setShowTop(window.scrollY > 200);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="scroll-progress" role="progressbar" aria-label="Page scroll progress">
        <span className="scroll-progress-bar" style={{ transform: `scaleX(${progress})` }} />
      </div>

      <div className="ambient" aria-hidden="true">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
      </div>

      <main className="page-main">{children}</main>

      <footer className="site-footer">
        <p>Portfolio forensic tool</p>
      </footer>

      <button
        type="button"
        className={showTop ? "back-to-top visible" : "back-to-top"}
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12 5.5 5 12.5l1.4 1.4L11 9.3V19h2V9.3l4.6 4.6L19 12.5z" />
        </svg>
      </button>
    </>
  );
}
