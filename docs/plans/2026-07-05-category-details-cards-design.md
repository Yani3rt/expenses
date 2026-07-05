# Category Details Cards Design

## Goal
Replace the removed ranked categories card on the spending page with a premium category details section.

## Layout
- Full-width section rendered where the deleted card was.
- Featured top category card spans two columns on desktop.
- Remaining categories render as supporting cards.
- On smaller screens, cards become a horizontally scrollable rail.

## Content
- One informational card per category for the selected month.
- Cards show category name, descriptor, icon badge, total spend, count, average, and latest expense date.
- Top category is featured; remaining categories use a smaller variant.

## Styling
- Premium feel through stronger whitespace, typography hierarchy, soft shadowing, and tone-tinted icon badges.
- Reuse the existing icon/tone system and avoid new dependencies.

## Data
- Use existing `getSpendingData()` category rows.
- Sort by total spend descending.
- Derive a descriptor from a local mapping with safe fallbacks.

## Interaction
- Informational only.
- Month-aware via existing spending page data.

## Verification
- Run against `/Users/yani/Dev/expenses/expenses.db`.
- Verify responsive horizontal scrolling on small screens.
- Run `EXPENSE_DB_PATH=/Users/yani/Dev/expenses/expenses.db pnpm test`.
