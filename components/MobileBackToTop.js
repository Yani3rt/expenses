"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function MobileBackToTop() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mobileQuery = window.matchMedia("(max-width: 760px)");
    if (!mobileQuery.matches) {
      setIsVisible(false);
      return;
    }

    const sentinel = document.querySelector("[data-top-sentinel]");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting);
      },
      {
        threshold: 0.01,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [pathname]);

  function scrollToTop() {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      className={`mobile-back-to-top${isVisible ? " is-visible" : ""}`}
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      aria-label="Back to top"
      onClick={scrollToTop}
    >
      ↑
    </button>
  );
}
