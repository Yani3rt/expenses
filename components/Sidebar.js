"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AppIcon } from "./Icons.js";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", eyebrow: "Home", icon: "dashboard" },
  { href: "/spending", label: "Spending", eyebrow: "Categories", icon: "spending" },
  { href: "/transactions", label: "Transactions", eyebrow: "Ledger", icon: "transactions" },
  { href: "/people", label: "People", eyebrow: "Paid by", icon: "people" },
  { href: "/status", label: "Status", eyebrow: "DB", icon: "status" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const saved = window.localStorage.getItem("expense-viewer-sidebar-collapsed");
    setIsCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    document.body.classList.toggle("sidebar-collapsed", isCollapsed);
    window.localStorage.setItem("expense-viewer-sidebar-collapsed", `${isCollapsed}`);

    return () => {
      document.body.classList.remove("sidebar-collapsed");
    };
  }, [isCollapsed]);

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
          className={`mobile-nav-toggle${isOpen ? " is-open" : ""}`}
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

      <button
        type="button"
        className="desktop-sidebar-restore"
        aria-label="Show navigation sidebar"
        onClick={() => setIsCollapsed(false)}
      >
        <AppIcon name="dashboard" />
        <span>Menu</span>
      </button>

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
            className="desktop-sidebar-collapse"
            aria-label="Hide navigation sidebar"
            onClick={() => setIsCollapsed(true)}
          >
            <span aria-hidden="true">‹</span>
          </button>
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
                <span className="nav-item-main">
                  <span className="nav-icon-wrap">
                    <AppIcon name={item.icon} />
                  </span>
                  <span className="nav-copy">
                    <span>{item.label}</span>
                    <small>{item.eyebrow}</small>
                  </span>
                </span>
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
