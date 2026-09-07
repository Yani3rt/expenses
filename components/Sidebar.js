"use client";

import Link from "next/link";
import ThemeSwitcher from "./ThemeSwitcher.js";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MORE_LINKS = [
  ["/spending", "Category analysis"],
  ["/transactions", "Full ledger"],
  ["/people", "People"],
  ["/status", "Database status"],
];

export default function Sidebar() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState("spending");
  const headerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const menuTriggerRef = useRef(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (pathname !== "/") return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const ledger = document.getElementById("transactions");
      const top = ledger?.getBoundingClientRect().top ?? Infinity;
      const threshold = Math.max((headerRef.current?.getBoundingClientRect().bottom ?? 62) + 32, window.innerHeight * .3);
      const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      setActiveSection(window.scrollY > 0 && (top <= threshold || (atEnd && top < window.innerHeight)) ? "transactions" : "spending");
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    const workspace = document.querySelector("main.workspace");
    if (workspace) observer.observe(workspace);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [pathname]);

  function selectSection(section) {
    setActiveSection(section);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuTriggerRef.current?.focus();
      } else if (event.type === "pointerdown" && !menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, [open]);

  return (
    <header className="topbar" ref={headerRef}>
      <div className="topbar-inner">
        <Link className="brand" href="/" aria-label="Expense Viewer home">
          <span className="brand-mark" aria-hidden="true"><i /><i /></span>
          <strong>Expense Viewer</strong>
        </Link>
        <nav className="topnav" aria-label="Primary navigation">
          {pathname === "/" ? <a className={activeSection === "spending" ? "active" : undefined} aria-current={activeSection === "spending" ? "location" : undefined} href="#spending" onClick={() => selectSection("spending")}>Spending</a> : <Link href="/">Spending</Link>}
          {pathname === "/" ? <a className={activeSection === "transactions" ? "active" : undefined} aria-current={activeSection === "transactions" ? "location" : undefined} href="#transactions" onClick={() => selectSection("transactions")}>Ledger</a> : <Link href="/#transactions">Ledger</Link>}
          <div className="more-menu" ref={menuRef}>
            <button type="button" ref={menuTriggerRef} aria-expanded={open} aria-controls="more-navigation" onClick={() => setOpen(value => !value)}>More <span aria-hidden="true">⌄</span></button>
            {open ? <div className="more-menu-panel" id="more-navigation" onClick={() => setOpen(false)}>
              {MORE_LINKS.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
            </div> : null}
          </div>
        </nav>
        <div className="topbar-preferences"><ThemeSwitcher /><Link className="topbar-status" href="/status"><span aria-hidden="true" />Read only</Link></div>
      </div>
    </header>
  );
}
