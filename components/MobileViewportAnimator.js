"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const TARGET_SELECTOR = [
  ".page-header",
  ".metrics-grid > .metric",
  ".content-grid > .card",
  ".category-details-item",
  ".ledger-card",
].join(", ");

export default function MobileViewportAnimator() {
  const pathname = usePathname();
  const routeKey = pathname;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!mobileQuery.matches || reducedMotionQuery.matches) return;

    let frame = 0;
    let observer = null;
    let cleanup = () => {};

    const initialize = () => {
      const nodes = Array.from(document.querySelectorAll(TARGET_SELECTOR));
      if (!nodes.length) return () => {};

      const seen = new Set();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

      const isInView = (node) => {
        const rect = node.getBoundingClientRect();
        return rect.top < viewportHeight * 0.92 && rect.bottom > viewportHeight * 0.08;
      };

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.remove("motion-pending");
            entry.target.classList.add("motion-visible");
            seen.add(entry.target);
            observer?.unobserve(entry.target);
          });
        },
        {
          threshold: 0.18,
          rootMargin: "0px 0px -8% 0px",
        },
      );

      nodes.forEach((node) => {
        node.classList.add("motion-reveal-target");

        if (isInView(node)) {
          node.classList.add("motion-visible");
          seen.add(node);
          return;
        }

        node.classList.add("motion-pending");
        observer.observe(node);
      });

      return () => {
        observer?.disconnect();
        nodes.forEach((node) => {
          node.classList.remove("motion-pending", "motion-visible", "motion-reveal-target");
        });
        seen.clear();
      };
    };

    frame = window.requestAnimationFrame(() => {
      cleanup = initialize();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      cleanup();
    };
  }, [routeKey]);

  return null;
}
