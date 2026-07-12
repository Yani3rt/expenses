# Category Month Modal Color Design

## Goal

Make the category-month transaction modal feel more expressive while preserving the calm, readable, read-only product experience.

## Approved direction

Use a restrained, category-aware color treatment. The modal remains a neutral white surface; the selected category color supplies hierarchy and recognition rather than becoming decoration.

## Color strategy

- Keep the modal shell and primary text neutral for contrast and continuity.
- Derive one accent from the existing category mapping (`--category-accent`).
- Tint the four summary cards with a 5–8% category wash and a subtle category-toned perimeter border.
- Use the category accent on the “Category month” label, chart, focus ring, and selected expense state.
- Keep labels and values dark; never place low-contrast gray text directly on a colored surface.
- Do not introduce gradients, new palette tokens, decorative blobs, or unrelated accent colors.

## Component treatment

### Header

The eyebrow becomes category-colored while the title and selected-transaction description remain neutral. The close button receives a subtle category-tinted hover/focus state.

### Summary metrics

Each metric uses the same light category wash and hairline border. Labels use a darkened category-aware foreground; monetary values remain high-contrast ink. This keeps the four cards coherent instead of creating a rainbow grid.

### Chart

The existing Dither chart retains its category-derived series color. Axis text stays neutral for readability.

### Expense list

The selected expense keeps its category tint and gains a full hairline category border instead of a side-stripe treatment. Other rows remain neutral so selection remains obvious.

## Accessibility

- Color reinforces category and selection but never replaces labels or `aria-current`.
- Body text and values retain at least WCAG AA contrast against tinted surfaces.
- Focus remains visible with a category-colored outline and structural button shape.
- No additional motion is introduced.

## Verification

- Add source-level regression coverage for the category-aware modal treatments.
- Run focused transaction UI tests and the full test suite.
- Verify at least Home and a brighter category such as Technology or Subscriptions in the local browser.
- Check desktop and narrow/mobile modal layouts for legibility and overflow.
