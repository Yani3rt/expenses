"use client";

export default function RangeTabs({ options, value, onChange, label, className = "" }) {
  const selectedIndex = Math.max(options.findIndex((option) => option.value === value), 0);
  return (
    <div className={`range-tabs count-${options.length} index-${selectedIndex} ${className}`.trim()} role="tablist" aria-label={label}>
      <span className="range-tabs-pill" aria-hidden="true" />
      {options.map((option) => (
        <button
          className="range-tabs-tab"
          type="button"
          role="tab"
          aria-selected={option.value === value}
          key={option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
