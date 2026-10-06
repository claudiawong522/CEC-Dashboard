@AGENTS.md

# CEC Dashboard — working agreement

## What this app is
Internal web app for the Cornell Entrepreneurship Club: events, prep-work tracking, photos, shared notes,
admin access. Next.js + Tailwind + shadcn/ui. Invite-only — members sign in with Google, but only after
an admin has invited their email from `/admin`; there's no self-serve signup.

## Design system, read before any UI change
`design/BRAND_KIT.md` (v2, 2026-10-06) is the source of truth: it is a transcription of cornellec.com's
own system, measured from the live site. Tokens live in `design/brand-tokens.css` (imported by the
global stylesheet) and the `@theme` block in `app/globals.css` (Tailwind v4 CSS-first config, no
`tailwind.config.js`). The two `.dc.html` mockups in `design/` are the retired v1 and are history only.

## Non-negotiables
- White ground, black text, `subtle` (#4A4A4A) body copy, `line` hairlines. No cream, no warm greys,
  no Cornell red. Mint (#3DFFA2) is the only accent: primary button, active underline, checked states,
  hard shadows. Mint as text is `mint-dark`.
- Space Grotesk 700 uppercase for titles and 500 uppercase for every label (`t-display`, `t-eyebrow`);
  DM Sans 400/500/600 for everything read. No other faces, no italics.
- Radius 0 everywhere. Controls carry a 2px black border; surfaces a 1px hairline. Only three shadows:
  `shadow-soft`, `shadow-mint` (and its sm/lg sizes). Linked cards lift 4px to a black border and mint shadow.
- Section colours are fixed and come from the logo tiles: Venue/Attendees/Media teal, Speaker/Marketing
  coral, Money/Recurring blue, Food/Notes amber. They appear as flat bars, swatches and triangles, never
  as tints behind text.
- Every screen in the shell starts with `PageHeader`. Restyle shadcn primitives through the tokens;
  do not fork or hand-roll new primitives.
- Decor is `components/decor/` only: one `TriangleScatter` per screen behind content, `MintRule`,
  `Marquee` on the public pages. Nothing blurred, no gradients, nothing over an input or the editor.
- Motion: durations and easings from the table in `BRAND_KIT.md`, default `ease-fluid`. No motion on
  calendar cells. Respect `prefers-reduced-motion`.
- If a value is not in the kit, follow the 4px rhythm and the nearest documented token, then add the
  decision to `BRAND_KIT.md`.

## When the design changes
Update `BRAND_KIT.md` in the same PR as the code, and note what changed at the bottom of that file.
