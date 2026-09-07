"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const keyFor = (year, month, day) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export default function PeriodDatePicker({ value, onChange }) {
  const dialog = useRef(null);
  const trigger = useRef(null);
  const [view, setView] = useState(() => value.slice(0, 7).split("-").map(Number));
  const [mounted, setMounted] = useState(false);
  const [year, monthNumber] = view;
  const month = monthNumber - 1;
  const count = new Date(year, month + 1, 0).getDate();
  const start = new Date(year, month, 1).getDay();
  const [selectedYear, selectedMonth, selectedDay] = value.split("-").map(Number);

  function close() {
    dialog.current?.close();
    trigger.current?.focus();
  }
  function open() {
    setView([selectedYear, selectedMonth]);
    setMounted(true);
  }
  const attachDialog = useCallback((node) => {
    dialog.current = node;
    if (node && !node.open) {
      node.showModal();
      node.querySelector('[aria-pressed="true"]')?.focus();
    }
  }, []);
  function shiftMonth(delta) {
    const date = new Date(year, month + delta, 1);
    setView([date.getFullYear(), date.getMonth() + 1]);
  }
  function choose(day) {
    onChange(keyFor(year, month, day));
    close();
  }

  return <>
    <button className="period-date-trigger" ref={trigger} type="button" aria-label="Period end date" aria-haspopup="dialog" onClick={open}>
      <span>{MONTHS[selectedMonth - 1].slice(0, 3)} {selectedDay}, {selectedYear}</span>
      <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 10h16"/></svg>
    </button>
    {mounted && createPortal(<dialog className="period-calendar" ref={attachDialog} aria-labelledby="period-calendar-title" onClose={() => { setMounted(false); trigger.current?.focus(); }} onClick={event => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close(); } }}>
      <header><h2 id="period-calendar-title">Period end date</h2><button type="button" onClick={close} aria-label="Close calendar">×</button></header>
      <div className="calendar-navigation">
        <button type="button" aria-label="Previous calendar month" onClick={() => shiftMonth(-1)}>←</button>
        <label><span className="sr-only">Calendar month</span><select aria-label="Calendar month" value={month} onChange={event => setView([year, Number(event.target.value) + 1])}>{MONTHS.map((label, i) => <option value={i} key={label}>{label}</option>)}</select></label>
        <label><span className="sr-only">Calendar year</span><select aria-label="Calendar year" value={year} onChange={event => setView([Number(event.target.value), monthNumber])}>{Array.from({ length: Math.max(2100, year) - Math.min(1900, year) + 1 }, (_, i) => Math.min(1900, year) + i).map(option => <option key={option}>{option}</option>)}</select></label>
        <button type="button" aria-label="Next calendar month" onClick={() => shiftMonth(1)}>→</button>
      </div>
      <div className="calendar-days">
        {WEEKDAYS.map(day => <span className="calendar-weekday" key={day} aria-hidden="true">{day}</span>)}
        {Array.from({ length: start }, (_, i) => <span key={`blank-${i}`} />)}
        {Array.from({ length: count }, (_, i) => <button type="button" key={i} aria-label={`${MONTHS[month]} ${i + 1}, ${year}`} aria-pressed={value === keyFor(year, month, i + 1)} onClick={() => choose(i + 1)}>{i + 1}</button>)}
      </div>
    </dialog>, document.body)}
  </>;
}
