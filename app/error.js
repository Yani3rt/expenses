"use client";

export default function Error({ reset }) {
  return (
    <section className="route-error" role="alert">
      <p className="label">Source unavailable</p>
      <h1>We could not read the expense data.</h1>
      <p>The source may be temporarily offline or out of reach. No expense data was changed.</p>
      <button type="button" onClick={() => reset()}>Try again</button>
    </section>
  );
}
