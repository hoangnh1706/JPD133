# JPD133 UI design system

This master adapts the `ui-ux-pro-max` search result for “Japanese exam preparation adult students editorial minimal” to the existing JPD133 Sakura identity. The first broader search returned a playful children's style and was rejected because it did not fit the audience. The targeted landing-domain search had no matching row; the landing pattern below comes from the verified design-system result.

## Direction

- Product: self-study Japanese learning and JPD133 exam practice for students.
- Style: calm Japanese editorial minimalism, clear grid, warm paper surfaces, restrained Sakura details.
- Landing structure: hero → verified content counts → learning tools → lesson path → how it works → final CTA → footer.
- No testimonials, graduation claims, or official exam promises without a source.
- Main CTA is the learning app; every secondary CTA has a working destination.

## Tokens

| Role | Light | Dark |
|---|---|---|
| Background | `#FAF9F6` | `#171C22` |
| Surface | `#FFFFFF` | `#242A31` |
| Text | `#252B36` | `#F4F1EF` |
| Muted text | `#5E6673` | `#B6BEC8` |
| Border | `#EAE6E3` | `#39414A` |
| Sakura accent | `#E87991` | `#F0A8B7` |
| Action / link | `#A63D59` | `#E6A1B1` |
| Action fill | `#A63D59` | `#A63D59` |
| Success | `#3B9B7A` | `#77C6A3` |

The rose accent is decorative. White text on `#E87991` is below normal-text contrast, so filled action buttons use the darker rose `#A63D59` (white contrast > 6:1). Use semantic variables in CSS rather than raw brand hex inside components.

## Type and rhythm

- Body and Vietnamese UI: Be Vietnam Pro with Noto Sans JP fallback for Japanese.
- Japanese display accent: Noto Serif JP.
- Base body: 16px; reading text line-height ≥ 1.75; Japanese reading passages line-height ≥ 2.
- Spacing scale: 4, 8, 16, 24, 32, 48, 64px. Content max width 1200px.
- Card radii: 16–24px; light border and restrained shadow, no playful 3D.

## Interaction and accessibility

- Real anchor links for route navigation; buttons for actions and in-page scrolling.
- Visible keyboard focus. Icon-only controls have labels. Mobile targets at least 44px where space allows.
- Mobile layout at 375px; tablet at 768px; desktop at 1024px and 1440px. No horizontal document overflow.
- Animations only use opacity and transform, are restrained, and stop under reduced motion.
- Reserve image area, lazy load below-fold media, split route bundles where possible.
- Do not use color alone for answer or progress state. Keep data and exam claims sourced and clearly labeled as practice.

## Page overrides

See `pages/landing.md` for the public landing page.
