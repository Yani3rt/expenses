# Month Spend Sparkline Design

## Goal

Add a responsive decorative mini line graph behind the Dashboard Month spend metric using this month’s active spending days.

## Design

- Reuse `data.dailyTotals`; no new query or dependency.
- Plot daily totals rather than cumulative spending.
- Render a responsive SVG line and subtle area fill behind the existing label, amount, detail, and icon.
- Show no axes, labels, values, points, tooltips, or interaction.
- Keep the graph decorative with `aria-hidden="true"`.
- Preserve the current metric-card height, layout, colors, and responsive behavior.
- Ensure foreground content remains above the graph and readable.

## Verification

- Source-contract tests verify the Month spend card receives daily totals and renders the decorative sparkline.
- Responsive CSS tests verify layering and scaling.
- Run the full test suite and production build.
