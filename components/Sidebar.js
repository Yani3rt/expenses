"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", eyebrow: "Home" },
  { href: "/spending", label: "Spending", eyebrow: "Categories" },
  { href: "/transactions", label: "Transactions", eyebrow: "Ledger" },
  { href: "/people", label: "People", eyebrow: "Paid by" },
  { href: "/status", label: "Status", eyebrow: "DB" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <div className="mobile-topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">EV</span>
          <span>
            <strong>Expense Viewer</strong>
            <small>Read-only cockpit</small>
          </span>
        </Link>
        <button
          type="button"
          className="mobile-nav-toggle"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          aria-controls="primary-navigation"
          onClick={() => setIsOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <button
        type="button"
        className={`mobile-backdrop${isOpen ? " is-open" : ""}`}
        aria-label="Close navigation menu"
        onClick={() => setIsOpen(false)}
      />

      <aside className={`sidebar${isOpen ? " is-open" : ""}`}>
        <div className="sidebar-head">
          <Link className="brand desktop-brand" href="/">
            <span className="brand-mark">EV</span>
            <span>
              <strong>Expense Viewer</strong>
              <small>Read-only cockpit</small>
            </span>
          </Link>
          <button
            type="button"
            className="mobile-nav-close"
            aria-label="Close navigation menu"
            onClick={() => setIsOpen(false)}
          >
            ×
          </button>
        </div>
        <nav className="side-nav" id="primary-navigation" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link className={active ? "active" : ""} href={item.href} key={item.href}>
                <span>{item.label}</span>
                <small>{item.eyebrow}</small>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-status">
          <span className="status-dot" />
          <div>
            <strong>READ ONLY</strong>
            <small>No writes. No migrations.</small>
          </div>
        </div>
      </aside>
    </>
  );
}
