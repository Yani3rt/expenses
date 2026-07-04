"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MonthPicker({ months, activeMonth }) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(activeMonth);

  useEffect(() => {
    setSelectedMonth(activeMonth);
  }, [activeMonth]);

  function handleChange(event) {
    setSelectedMonth(event.target.value);
    const params = new URLSearchParams(window.location.search);
    params.set("month", event.target.value);
    router.push(`/spending?${params.toString()}`);
  }

  return (
    <label className="header-month-picker">
      <select name="month" value={selectedMonth} onChange={handleChange} aria-label="Spending month">
        {months.map((month) => <option value={month.value} key={month.value}>{month.label}</option>)}
      </select>
    </label>
  );
}
