---
version: alpha
name: Insight Financial
description: A calm, read-only financial dashboard design system for the expense-viewer project.
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#131b2e'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#dae2fd'
  inverse-primary: '#bec6e0'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#003824'
  tertiary: '#23005c'
  on-tertiary: '#ffffff'
  tertiary-container: '#e9ddff'
  on-tertiary-container: '#23005c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  accent-emerald: '#10B981'
  accent-violet: '#8B5CF6'
  accent-amber: '#F59E0B'
  accent-blue: '#3B82F6'
  accent-cyan: '#06B6D4'
  accent-pink: '#EC4899'
  accent-indigo: '#6366F1'
  accent-coral: '#F97316'
typography:
  display:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: '-0.02em'
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: '-0.01em'
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: '0.05em'
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding-desktop: 40px
  container-padding-mobile: 20px
  gutter: 24px
  card-gap: 24px
  section-margin: 64px
components:
  insight-card:
    backgroundColor: '{colors.surface-container-lowest}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.xl}'
    padding: 32px
  insight-card-glass:
    backgroundColor: '#ffffff'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.xl}'
    padding: 32px
  transaction-row:
    backgroundColor: '{colors.surface-container-lowest}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.md}'
    padding: 16px
  category-pill:
    backgroundColor: '{colors.surface-container-low}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.full}'
    padding: 8px
  category-marker-emerald:
    backgroundColor: '{colors.accent-emerald}'
    rounded: '{rounded.full}'
    size: 10px
  category-marker-violet:
    backgroundColor: '{colors.accent-violet}'
    rounded: '{rounded.full}'
    size: 10px
  category-marker-amber:
    backgroundColor: '{colors.accent-amber}'
    rounded: '{rounded.full}'
    size: 10px
  category-marker-blue:
    backgroundColor: '{colors.accent-blue}'
    rounded: '{rounded.full}'
    size: 10px
  category-marker-cyan:
    backgroundColor: '{colors.accent-cyan}'
    rounded: '{rounded.full}'
    size: 10px
  category-marker-pink:
    backgroundColor: '{colors.accent-pink}'
    rounded: '{rounded.full}'
    size: 10px
  category-marker-indigo:
    backgroundColor: '{colors.accent-indigo}'
    rounded: '{rounded.full}'
    size: 10px
  category-marker-coral:
    backgroundColor: '{colors.accent-coral}'
    rounded: '{rounded.full}'
    size: 10px
  trend-chip-neutral:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.full}'
    padding: 6px
  trend-chip-positive:
    backgroundColor: '{colors.secondary}'
    textColor: '{colors.on-secondary}'
    rounded: '{rounded.full}'
    padding: 6px
  trend-chip-warning:
    backgroundColor: '{colors.error-container}'
    textColor: '{colors.on-error-container}'
    rounded: '{rounded.full}'
    padding: 6px
  segmented-control:
    backgroundColor: '{colors.surface-container}'
    textColor: '{colors.on-surface-variant}'
    rounded: '{rounded.full}'
    padding: 4px
  segmented-control-active:
    backgroundColor: '{colors.surface-container-lowest}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.full}'
    padding: 8px
---

## Brand & Style
The design system is built on the principle of "Financial Lucidity." It rejects the traditional, high-density spreadsheet aesthetic in favor of a clean, sophisticated, and spatial interface. The target audience is the modern professional who values high-level insights over granular data entry.

The style is a blend of **Minimalism** and **Glassmorphism**, utilizing generous white space and subtle depth to make complex financial data feel approachable and "airy." The emotional response should be one of control, clarity, and calm. Editing interactions are suppressed; exploratory interactions such as filtering, sorting, date switching, search, and drilldowns are encouraged. The UI should feel like a high-end editorial dashboard rather than a utility form.

This app is a **read-only viewer**. The visual language must reinforce that posture: no edit affordances, no destructive actions, and no UI that implies the database can be changed from this project.

## Colors
The palette is anchored by a deep Navy (`primary: #131B2E`) for high-contrast text and structural elements, providing a sense of institutional security. The background uses a crisp, cool white with Slate-tinted neutrals to maintain softness.

Accent colors are vibrant and functionally assigned to data categories to enable "at-a-glance" recognition:
- **Emerald (`accent-emerald: #10B981`):** Growth, savings, health, and groceries.
- **Violet (`accent-violet: #8B5CF6`):** Recurring subscriptions and digital services.
- **Amber (`accent-amber: #F59E0B`):** Discretionary spending, food, and drink.
- **Blue (`accent-blue: #3B82F6`):** Fixed costs and transportation.
- **Cyan (`accent-cyan: #06B6D4`):** Technology and technical services.
- **Pink (`accent-pink: #EC4899`):** Clothes and personal shopping.
- **Indigo (`accent-indigo: #6366F1`):** Support and family/person-related categories.

Accent colors should be used as visual markers, chart strokes, category icons, pills, and large fills. Avoid using the brighter accents as small text on white; use `on-surface` or a darker paired foreground for readable labels.

## Typography
This design system employs a tiered typographic strategy to balance personality with precision. **Manrope** is used for headlines to provide a modern, tech-forward feel. **Hanken Grotesk** handles body text with exceptional legibility and a contemporary rhythm.

For numerical data and metadata labels, **JetBrains Mono** is utilized. Its monospaced nature ensures that currency values and dates align perfectly in lists and tables, reinforcing the "precision instrument" feel of the dashboard. Currency values, dates, percentages, and record counts should use tabular/monospace styling whenever possible.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a max-width of 1440px. A 12-column system is used for desktop, collapsing to 4 columns on mobile.

The rhythm is intentionally spacious to counteract "spreadsheet fatigue." Large 40px margins surround the main viewport. Components are grouped into "clusters" with 24px gaps. On mobile, the layout reflows into a single vertical stack, prioritizing the monthly total, category breakdown, recent expenses, largest expenses, and then filters/search. Dense raw-data views should remain secondary on mobile.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Ambient Shadows**. The base canvas is the lightest neutral (`#F7F9FB`). Cards sit on a secondary elevation using pure white backgrounds with a very soft, large-radius shadow at approximately 15% opacity of the primary Navy to create a "floating" effect.

Interactive or "insight" cards utilize a subtle **Glassmorphism** effect—a 4px backdrop blur with a 60% translucent white fill—to sit atop the primary data layer. This creates a sense of hierarchy where summary insights feel more "present" than the historical transaction feed.

## Shapes
The shape language is consistently **Rounded**. The standard 0.5rem (8px) radius is applied to small components like input chips and buttons, while large containers and data cards use the `rounded-xl` (1.5rem / 24px) setting. This significant curvature removes the "sharpness" associated with traditional financial software, making the dashboard feel friendly and organic.

## Components
- **Insight Cards:** These are the primary containers. They feature a white background, `rounded-xl` corners, and internal padding of 32px. Titles use `label-caps` for a technical feel.
- **Charts:** Donut and line charts must use a 3px stroke width. Gradients are encouraged for line charts, fading from the accent color to transparent.
- **Transaction Feed:** Instead of a table, use a refined list. Each row has a 1px border-bottom in the lightest neutral. Icons are housed in a circular background at roughly 20% opacity of the category color.
- **Trend Chips:** Small, pill-shaped badges (`rounded-full`) showing percentage changes. Use `primary` for neutral, `secondary` for positive/savings, and `error-container`/`on-error-container` for overspending or negative signals.
- **Segmented Controls:** Used for time-period switching (e.g., 1W, 1M, 1Y). These should look like a single pill-shaped track with a sliding white "active" state background.
- **Category Pills:** Category chips should combine a subtle tinted background, dark readable text, and a small colored dot or icon matching the category visual mapping.
- **Data Status:** A small footer/status chip should show read-only status, database freshness, latest expense date, and record count.

## Do's and Don'ts

Do:
- Present expense data as read-only insights.
- Support filtering, sorting, drilldowns, search, and export of query results.
- Make database freshness and read-only status visible.
- Prefer cards, timelines, and refined lists over dense spreadsheets.
- Keep money, dates, and percentages visually aligned with mono/tabular styling.

Don't:
- Show edit, delete, add, save, sync, migration, or repair actions.
- Use form-heavy layouts unless the form is strictly for filtering.
- Present budget controls as editable from this app.
- Use bright accent colors as small text on white backgrounds.
- Hide the raw data table entirely; make it available, but secondary.

## Expense Category Visual Mapping

Use these stable category colors for the current expense database:

- **Subscriptions:** Violet (`accent-violet`)
- **Technology:** Cyan (`accent-cyan`)
- **Clothes:** Pink (`accent-pink`)
- **Health:** Emerald (`accent-emerald`)
- **Support:** Indigo (`accent-indigo`)
- **Food:** Amber (`accent-amber`)
- **Groceries:** Emerald (`accent-emerald`)
- **Transport:** Blue (`accent-blue`)
- **Travel:** Blue (`accent-blue`)
- **Utilities & services:** Blue (`accent-blue`)
- **Rent / Mortgage:** Primary Navy (`primary`)
- **Taxes:** Coral/Error (`accent-coral` or `error`)
- **Pets:** Amber (`accent-amber`)
- **Education:** Indigo (`accent-indigo`)
- **Unknown/Other:** `on-surface-variant`
