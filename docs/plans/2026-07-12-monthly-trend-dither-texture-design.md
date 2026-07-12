# Monthly Trend Dither Texture Design

## Goal

Bring the existing dither-kit chart language into every blue filled bar in the Monthly trend card.

## Approach

Keep the current semantic button and dynamic-height fill elements. Add a CSS-only texture layer to each `.month-track > div` using a pseudo-element. The layer uses a compact ordered-dot pattern and a vertical mask so the texture is denser near the bottom and dissolves toward the top, echoing the dither-kit `paintColumn` treatment without introducing canvas rendering into this small overview chart.

## Visual behavior

- Every non-zero blue monthly fill receives the texture.
- The base blue, rounded capsule shape, existing height animation, and click animation remain unchanged.
- The dots use alpha rather than a second hard-coded color so the treatment remains compatible with theme changes.
- The texture is decorative and introduces no new interactive or accessible content.

## Scope and constraints

- Modify only `app/globals.css` and the focused dashboard UI test.
- Add no dependency.
- Do not change expense data access or database behavior.
- Preserve reduced-motion and responsive behavior.

## Verification

Add a regression assertion for the pseudo-element texture and gradient mask, run the complete Node test suite, run the production build, and visually inspect the Monthly trend card in the browser.
