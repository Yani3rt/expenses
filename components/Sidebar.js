"use client";

import Link from "next/link";
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
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const menuTriggerRef = useRef(null);

  useEffect(() => setOpen(false), [pathname]);
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
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" href="/" aria-label="Expense Viewer home">
          <span className="brand-mark" aria-hidden="true"><i /><i /></span>
          <strong>Expense Viewer</strong>
        </Link>
        <nav className="topnav" aria-label="Primary navigation">
          {pathname === "/" ? <a className="active" href="#spending">Spending</a> : <Link href="/">Spending</Link>}
          {pathname === "/" ? <a href="#transactions">Ledger</a> : <Link href="/#transactions">Ledger</Link>}
          <div className="more-menu" ref={menuRef}>
            <button type="button" ref={menuTriggerRef} aria-expanded={open} aria-controls="more-navigation" onClick={() => setOpen(value => !value)}>More <span aria-hidden="true">⌄</span></button>
            {open ? <div className="more-menu-panel" id="more-navigation" onClick={() => setOpen(false)}>
              {pathname === "/" ? <a href="#transactions">Ledger</a> : null}
              {MORE_LINKS.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
            </div> : null}
          </div>
        </nav>
        <Link className="topbar-status" href="/status"><span aria-hidden="true" />Read only</Link>
      </div>
    </header>
  );
}
