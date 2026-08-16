"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Detect" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/#limits", label: "Limits" },
];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

      <header className="site-header glass">
        <nav className={open ? "nav open" : "nav"} aria-label="Primary">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : link.href.startsWith("/how-it-works")
                  ? pathname.startsWith("/how-it-works")
                  : false;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "active" : undefined}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button
          className="menu-toggle"
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
      </header>

      <main className="page-main">{children}</main>

      <footer className="site-footer">
        <p>
          On-device forensics · files stay in this tab ·{" "}
          <Link href="/how-it-works">how it works</Link>
        </p>
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
