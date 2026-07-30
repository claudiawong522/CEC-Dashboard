@AGENTS.md

# CEC Dashboard — working agreement

## What this app is
Internal web app for the Cornell Entrepreneurship Club: events, prep-work tracking, photos, shared notes,
admin access. Next.js + Tailwind + shadcn/ui. Members sign in with Google, @cornell.edu only.

## Design system — read before any UI change
`design/BRAND_KIT.md` is the source of truth for colour, type, radii, controls, stickers and motion.
`design/CEC Brand Kit.dc.html` and `design/CEC Pages.dc.html` are the visual references — open them in a
browser to see intended look and behaviour. Tokens live in `design/brand-tokens.css` (imported by the
global stylesheet) and `design/tailwind.brand.js` (merged into the `@theme` block in `app/globals.css` —
this project uses Tailwind v4's CSS-first config, not a `tailwind.config.js`).

## Non-negotiables
- Cream paper ground (`--paper`, `--page`), grey body text, warm hairlines. No cool greys, no pure white,
  no pure black, no Cornell red.
- Hanken Grotesk at 300/400/500 only — no 600, no italics. Geist Mono for time, dates, tags, ids.
- Hierarchy from size and grey value, never from bold. Emphasis is one 500-weight word or a hairline link.
- The CENT gradient triangle is the only bright element: mark, progress, active-tab underline, checked
  checkbox, avatar ring. Tints 10–24% for states. Switches use the pastel gradient.
- Section colours are fixed: Venue/Attendees/Media teal, Speaker/Marketing coral, Money/Recurring blue,
  Food/Notes amber.
- Restyle shadcn primitives with the tokens; don't fork or hand-roll new primitives.
- Stickers: functional ones at full strength, decorative ones at low opacity behind ≥70%-opaque content.
  Every screen (including forms, Admin and Notes) gets sticker decor — see `BRAND_KIT.md` § Sticker rules
  for the current, denser direction. Each sticker animates on its own click; many also carry a hover
  micro-transition (rotate/scale/width) from the kit's reference swatches.
- Motion durations and easings come from the motion table in `BRAND_KIT.md`. No motion on calendar cells.
  Respect `prefers-reduced-motion`.
- Every new surface must be checkable against the kit — if a value isn't in it, follow the 4px rhythm and
  the nearest documented token, then add the decision to `BRAND_KIT.md`.

## When the design changes
Update `BRAND_KIT.md` in the same PR as the code, and note what changed at the bottom of that file.
