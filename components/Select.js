"use client";

import { Children, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

/** Select-only combobox. The top-layer list stays inside its owning dialog's DOM. */
export default function Select({ value, onChange, children, name, disabled = false, "aria-label": label }) {
  const options = Children.toArray(children).map(child => ({
    value: String(child.props.value ?? child.props.children),
    label: String(child.props.children),
    disabled: Boolean(child.props.disabled),
  }));
  const selected = options.findIndex(option => option.value === String(value));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const trigger = useRef(null);
  const list = useRef(null);
  const search = useRef({ text: "", time: 0 });
  const id = useId();

  function show() {
    if (disabled) return;
    setActive(selected >= 0 ? selected : Math.max(0, options.findIndex(option => !option.disabled)));
    setOpen(true);
  }
  function choose(index) {
    if (!options[index] || options[index].disabled) return;
    setOpen(false);
    trigger.current?.focus();
    onChange({ target: { value: options[index].value, name } });
  }

  useLayoutEffect(() => {
    if (!open) return;
    const popup = list.current;
    popup.showPopover();
    const place = () => {
      const rect = trigger.current.getBoundingClientRect();
      const width = Math.min(Math.max(rect.width, 180), window.innerWidth - 16);
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const upwards = below < 220 && above > below;
      const height = Math.min(280, Math.max(80, upwards ? above : below));
      Object.assign(popup.style, {
        width: `${width}px`, maxHeight: `${height}px`,
        left: `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`,
        top: upwards ? 'auto' : `${rect.bottom + 5}px`,
        bottom: upwards ? `${window.innerHeight - rect.top + 5}px` : 'auto',
      });
    };
    place();
    const scroll = event => { if (!popup.contains(event.target)) place(); };
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    window.addEventListener('resize', place);
    document.addEventListener('scroll', scroll, true);
    document.addEventListener('pointerdown', outside);
    return () => {
      if (popup.matches(':popover-open')) popup.hidePopover();
      window.removeEventListener('resize', place);
      document.removeEventListener('scroll', scroll, true);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open]);

  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function keyDown(event) {
    if (event.key === 'Escape' && open) {
      event.preventDefault(); event.stopPropagation(); setOpen(false); return;
    }
    if (event.key === 'Tab') { setOpen(false); return; }
    if (['Enter', ' '].includes(event.key)) {
      event.preventDefault(); if (open) choose(active); else show(); return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!open) { show(); return; }
      const enabled = options.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0);
      const position = enabled.indexOf(active);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : Math.max(0, Math.min(enabled.length - 1, position + (event.key === 'ArrowDown' ? 1 : -1)));
      setActive(enabled[next] ?? 0);
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      const text = (now - search.current.time < 700 ? search.current.text : '') + event.key.toLowerCase();
      search.current = { text, time: now };
      const match = options.findIndex(option => !option.disabled && option.label.toLowerCase().startsWith(text));
      if (!open) show();
      if (match >= 0) setActive(match);
    }
  }

  return <span className="custom-select" ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button className="custom-select-trigger" type="button" role="combobox" ref={trigger}
      aria-label={label} aria-expanded={open} aria-haspopup="listbox" aria-controls={id}
      aria-activedescendant={open ? `${id}-${active}` : undefined} data-value={String(value)}
      disabled={disabled} onKeyDown={keyDown} onClick={() => open ? setOpen(false) : show()}>
      <span>{options[selected]?.label ?? 'Choose'}</span>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
    </button>
    <div className="custom-select-list" id={id} role="listbox" aria-label={label} ref={list} popover="manual">
      {options.map((option, index) => <div role="option" id={`${id}-${index}`} key={option.value}
        aria-selected={option.value === String(value)} aria-disabled={option.disabled || undefined}
        className={index === active ? 'custom-select-option is-active' : 'custom-select-option'}
        data-value={option.value} data-index={index} onPointerDown={event => event.preventDefault()}
        onClick={event => { event.preventDefault(); event.stopPropagation(); choose(index); }}>
        <span>{option.label}</span><span className="custom-select-check" aria-hidden="true">{option.value === String(value) ? '✓' : ''}</span>
      </div>)}
    </div>
  </span>;
}
