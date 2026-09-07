"use client";

import { useEffect, useId, useRef, useState } from "react";
import { normalizeTheme, THEME_STORAGE_KEY } from "../lib/theme.js";

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const items = useRef([]);
  const menuId = useId();
  const [theme, setTheme] = useState("momentum");

  useEffect(() => {
    setTheme(normalizeTheme(document.documentElement.dataset.theme));
    const sync = (event) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
      const next = normalizeTheme(event.newValue);
      document.documentElement.dataset.theme = next;
      setTheme(next);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    items.current[theme === "momentum" ? 1 : 0]?.focus();
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  function changeTheme(value) {
    const next = normalizeTheme(value);
    document.documentElement.dataset.theme = next;
    setTheme(next);
    setOpen(false);
    trigger.current?.focus();
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* Theme still works when storage is unavailable. */ }
  }

  function handleKeys(event) {
    const index = items.current.indexOf(document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + 2) % 2;
      items.current[next]?.focus();
    } else if (/^[cm]$/i.test(event.key)) {
      event.preventDefault();
      items.current[event.key.toLowerCase() === "c" ? 0 : 1]?.focus();
    }
  }

  return <div className="theme-switcher" ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button type="button" className="theme-trigger" ref={trigger} aria-label="Visual theme"
      aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} data-theme-value={theme}
      onClick={() => setOpen(value => !value)} onKeyDown={event => {
        if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); setOpen(true); }
      }}>
      <svg className="theme-symbol" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z" /></svg>
      <span>{theme === "momentum" ? "Momentum" : "Classic"}</span>
      <svg className="theme-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
    </button>
    {open ? <div className="theme-menu" id={menuId} role="menu" aria-label="Visual theme" onKeyDown={handleKeys}>
      {["classic", "momentum"].map((value, index) => <button type="button" role="menuitemradio"
        aria-checked={theme === value} tabIndex={-1} key={value} ref={el => { items.current[index] = el; }}
        onClick={() => changeTheme(value)}>
        <span className={`theme-swatch theme-swatch-${value}`} aria-hidden="true" />
        <span>{value === "momentum" ? "Momentum" : "Classic"}</span>
        <span className="theme-check" aria-hidden="true">{theme === value ? "✓" : ""}</span>
      </button>)}
    </div> : null}
  </div>;
}
