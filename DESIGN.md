---
version: alpha
name: Insight Financial
description: A calm, household-focused read-only spending viewer design system.
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
  lg: 0.875rem
  xl: 1rem
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
  insight-panel:
    backgroundColor: '{colors.surface-container-low}'
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
The design system is built around a **friendly household cockpit**. It rejects dense accounting software and generic fintech dashboards in favor of clear comparisons, readable expense history, and plain-language explanations that help household members answer questions together.

The style is restrained, direct, and reassuring. Flat tonal layers and crisp borders make the data feel dependable without turning every section into a floating card. Editing interactions are suppressed; filtering, sorting, date switching, search, and drilldowns remain encouraged. Small moments of warmth come from household-friendly copy and category color, not decorative effects.

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

The rhythm is spacious enough for scanning without hiding useful context. Desktop uses a 12-column structure with 24px section gaps; mobile becomes one column while retaining compact route titles. The dashboard prioritizes the current-month comparison and its explanation before category and transaction detail.

## Elevation & Depth
Depth is conveyed through **Tonal Layers and Borders**. The base canvas is `#F7F9FB`; primary content uses white and secondary regions use the low surface token. Static content normally uses a one-pixel border with no shadow. A tight `0 4px 12px` shadow is reserved for sticky or temporarily elevated controls.

Interactive state is communicated through selection color, focus treatment, and short 150–220ms transitions. Static content does not lift on hover. Motion communicates navigation, filtering, loading, or drilldown state; page-wide entrance sequences and looping decorative effects are excluded.

## Shapes
The shape language is gently rounded rather than pillowy. Compact controls use 10–12px radii, standard content containers use 14–16px, and full pills are reserved for chips and status labels.

## Components
- **Summary Regions:** Use white or low-surface backgrounds, 14–16px corners, concise headings, and 22–28px padding. Prefer an unboxed region when grouping and whitespace already communicate structure.
- **Charts:** Use solid category colors and quiet neutral tracks. Avoid decorative glows and gradients; animation is limited to interaction feedback.
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
- Prefer ranked explanations, timelines, and refined lists over dense spreadsheets or repeated card grids.
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
