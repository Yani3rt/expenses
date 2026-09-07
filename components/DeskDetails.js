// Purely decorative stationery; no state, motion, or interaction.
export default function DeskDetails() {
  return <div className="desk-details" aria-hidden="true">
    <div className="desk-paper desk-paper-grid" />
    <div className="desk-paper desk-paper-receipt" />
    <svg className="desk-doodle desk-doodle-star" viewBox="0 0 80 90" fill="none">
      <path d="m35 12 7 23 24-2-19 16 8 24-21-14-20 13 7-25L5 33l24 2 6-23ZM12 80l47-5M17 85l36-5" />
    </svg>
    <svg className="desk-doodle desk-doodle-loop" viewBox="0 0 80 130" fill="none">
      <path d="M18 5c46 12 49 47 24 44S24 16 47 29s27 52-1 58S7 69 20 62s34 24 13 46m-8-5 7 8 9-3" />
    </svg>
    <div className="desk-coffee-ring" />
  </div>;
}
