"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", eyebrow: "Home" },
  { href: "/spending", label: "Spending", eyebrow: "Categories" },
  { href: "/transactions", label: "Transactions", eyebrow: "Ledger" },
  { href: "/people", label: "People", eyebrow: "Paid by" },
  { href: "/status", label: "Status", eyebrow: "DB" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <span className="brand-mark">EV</span>
        <span>
          <strong>Expense Viewer</strong>
          <small>Read-only cockpit</small>
        </span>
      </Link>
      <nav className="side-nav" aria-label="Primary navigation">
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
  );
}
