# Design folder

**Current system: `BRAND_KIT.md` v2 (2026-10-06), a transcription of cornellec.com.** `brand-tokens.css`
and `tailwind.brand.js` hold the v2 values. The spec behind the change is
`docs/superpowers/specs/2026-10-06-cornellec-rehaul-design.md`.

Everything below this line is the retired v1 handoff (cream paper, CENT gradient, stickers). The two
`.dc.html` mockups still open in a browser but no longer describe the app.

---

# Handoff: CEC Dashboard visual redesign (brand kit v1)

## Overview
A full visual redesign of the CEC Dashboard — the Cornell Entrepreneurship Club's internal app for events,
prep-work tracking, photos, notes and admin access. Information architecture and features are unchanged
from the app that exists today (Next.js + Tailwind + shadcn/ui). What changes is the surface: a warm cream
paper ground, grey body text, one soft grotesk typeface, the CENT gradient triangle as the only bright
element, a small library of airbrushed "sticker" graphics, and a tight, quiet motion system.

## About the design files
The files in this bundle are **design references authored in HTML** — prototypes that show intended look
and behaviour. They are not production code to copy. The task is to **recreate them inside the existing
Next.js + Tailwind + shadcn/ui codebase**, using its routing, component and data patterns. Keep shadcn
primitives; restyle them via the tokens in `BRAND_KIT.md` rather than hand-rolling new components.

Open the HTML files directly in a browser. They are self-contained (fonts load from Google Fonts).

- `CEC Brand Kit.dc.html` — the system: mark and lockups, colour, type, buttons, controls, sticker
  library, sticker placements, motion spec. **This is the source of truth.**
- `CEC Pages.dc.html` — mockups of every screen: Login, Calendar (month + week + year), New event step 1,
  Event details step 2 (all nine section panels — click the left tabs), Todo, Past Events, Photos, Notes,
  Admin. Interactive bits are live: hover states, tab switching, "mark as done" check animation, the seven
  step-1 switches, clickable stickers.
- `BRAND_KIT.md` — every token and rule in text form.
- `CLAUDE.md` — drop this at the repo root (or merge into an existing one) so Claude Code follows the kit
  on every future change.
- `brand-tokens.css` / `tailwind.brand.js` — paste-ready token definitions.

## Fidelity
**High fidelity.** Colours, type sizes, weights, radii, spacing, transition durations and easings are final
and exact. Recreate them faithfully. Where a value isn't specified, derive it from the 4px spacing rhythm
and the nearest documented token.

## Screens / views

### Shared shell (all pages except Login)
- Top bar, 26px horizontal page padding: gradient triangle mark (20×18px) + wordmark "CEC Dashboard"
  (500/14.5px, letter-spacing −0.012em) on the left; 32px circular avatar with initials on the right
  (`#F5F0E5` fill, `#4A443C` text, hover `#E2DACB`).
- Avatar click opens a 212px dropdown card: full name (500/13px), email (400/11.5px `#B0A899`), 1px divider,
  "Sign out" row (12.5px `#6E675C`, hover ground `#F5F0E5` + text `#23201C`). Enters with
  opacity 0→1 and translateY(−6px→0) over 200/240ms.
- Tab row beneath: Calendar, Todo, Past Events, Photos, Notes, Admin. Inactive 400/13px `#B0A899`
  (hover `#23201C`); active 500/13px `#23201C` with a 2px gradient underline inset 12px from the label box.
- 1px `rgba(35,32,28,.09)` rule closes the shell. Page content sits in 26px padding.

### 1. Login
Full-bleed cream page, content centred, no shell. Bottom-anchored cloud wash (three blurred radial
gradients: coral 22%, blue 20%, amber 18%, blur 8px). Stack, 19px gaps: 34×30px gradient mark →
"CEC Dashboard" 500/27px (−0.022em) → "Sign in with your @cornell.edu account" 400/14px `#6E675C` →
pill button `#23201C` / `#FDFAF4`, 11px 22px, radius 24px, with a 19px white circle holding a "G".
Failed sign-in shows one line, 400/12px `#B4472F`, below the button.
Seven stickers drift in the background at 50–85% opacity (float keyframes, 11–17s, ease-in-out infinite);
each is independently clickable and plays its own 620ms pop.

### 2. Calendar (home)
Header row: "Calendar" 500/25px (−0.022em) left; "+ New event" primary button right.
Toolbar: prev/next 31px square icon buttons + "Today" pill on the left, month title 400/17px centred,
Month/Week/Year segmented control on the right (active segment `#23201C` on `#FDFAF4`, mono 10px
uppercase tracking .12em).
Grid: 7 columns, 1px `rgba(35,32,28,.07)` gaps, 94px cells, day numbers 400/11.5px `#6E675C`
(adjacent-month days `#C9C4B6`, today 500 `#23201C`). Cells sit on `rgba(255,253,249,.74)` above a
decorative bloom field (four blurred radial gradients, 45% opacity) — **decor is behind the cells, never
above**. Today also carries the sun sticker (15px, top-right of the cell).
Event chips: 4px 7px, radius 6px, `rgba(255,253,249,.95)`, 1px border, 10.5px label, prefixed by a 7×6px
section-coloured triangle. Hover lifts 1px and darkens the border. Click → event details.
Week view: 44px time gutter + 7 columns of 52px rows; today's column at 55% paper with a cloud wash at the
top; events render as tinted blocks with a 2px left rule in the section colour.
Year view: 4×3 month cards; a 5px bead per event coloured by its first prep section; current month card
carries a blurred amber bloom and a stronger border.

### 3. New event — step 1
580px column. "New event" 500/24px + "step 1 of 2" mono 10px uppercase `#B0A899`.
Fields: Event name (full width), Date / Start time / End time (equal thirds, 11px gap), Venue.
Inputs: 10px 12px, radius 8px, 1px `rgba(35,32,28,.14)`, ground `#FFFDF9`, 13.5px text;
focus → border `#4A443C` + 3px `rgba(35,32,28,.05)` ring, 220ms.
"What does this event need?" 500/14px + helper 12.5px `#B0A899`. Then a bordered list (radius 10px) of
seven rows — Speaker, Attendees, Money, Food, Marketing, Media, Recurring — each a 12px/15px row with a
section triangle + label and a switch on the right. Row hover ground `#F5F0E5`.
Switch: 38×21px track, radius 12px, 2px padding; ON = pastel gradient
`linear-gradient(95deg,#F3B5A6,#EFDCA8,#AEDACA,#B7CBEB)`, OFF = `#EAE4D7`; 17px white knob translates
17px over 360ms `cubic-bezier(.34,1.6,.4,1)` (the only spring in the app).
Footer: "Continue" primary button + live "{n} sections selected" count.

### 4. Event details — step 2
"step 2 of 2" mono label + a "{n} of 9 done" pill on the gradient tint.
Header card (radius 11px, `#FFFDF9`): Event name (flex 2), Date, Start, End (flex 1 each), Save
(secondary). A sprig sticker sits at 70% opacity in the top-right, clipped by the card.
Two columns, 24px gap:
- **Left, 184px:** one 36px row per section — Venue, Speaker, Attendees, Money, Food, Marketing, Media,
  Recurring, Notes. Each row: section triangle + label 400/13px `#6E675C` (hover `#23201C`) + a 6px green
  `#3FA789` dot on the right when that section is done. The active row is marked by an absolutely
  positioned 36px pill on the gradient tint at 15%, animated with `top` over 340ms
  `cubic-bezier(.2,.9,.2,1)` — **animate `top`, not `transform`**.
- **Right:** panel card (radius 11px, `#FFFDF9`, 20/22px padding, min-height 352px). Title 400/19px
  (−0.014em) + "Mark as done" checkbox pill top-right. Panel content fades up 5px over 340ms on tab change.
  Per section: Venue = room input + evidence drop zone. Speaker = details textarea + single-portrait drop.
  Attendees = Luma link + notes + evidence. Money = Budgeted/Actual pair + notes + receipts. Food = usual
  textarea + halal switch (reveals a second field) + evidence. Marketing = 2-column checkbox grid of the
  seven fixed channels plus custom ones (hover × to delete) + "Add a custom channel…" + Add + evidence.
  Media = explainer + multi-file drop (images, video, zip). Recurring = Frequency select + Ends on +
  "Generate series" + evidence; collapses to "This series has already been generated." afterwards.
  Notes = optional notes textarea only. Every panel ends with a Save (secondary).
- **Checkbox:** 19px circle; unchecked 1px `rgba(35,32,28,.2)`; checked fills with the full gradient while
  a white 1.8px check draws via `stroke-dashoffset` 14→0 over 360ms `cubic-bezier(.4,0,.2,1)` (40ms delay),
  the label greys to `#B0A899` and a 1px `#B0A899` rule sweeps across it over 340ms. Put the animated
  value on the SVG **presentation attribute**, not in a style string.
- **Drop zone:** 1px dashed `rgba(35,32,28,.16)`, radius 10px, 24px padding, hint 400/12px `#B0A899`.
  Hover: border → `rgba(232,88,61,.5)` and a blurred multi-colour bloom rises from below to 30% opacity
  (400/500ms). Uploaded files show as 58px rounded thumbnails in a row, each lifting 2px on hover with a
  delete × revealed.

### 5. Todo
"Todo" 500/24px. Bordered list, one row per event: name 500/14px + date/time mono 10px uppercase
`#B0A899` on the right; below, one outlined pill per still-missing section (mono 9.5px uppercase, 4px 9px,
radius 20px, 6px section-coloured dot). Rows hover `#F5F0E5` and stagger in at 70ms intervals
(`riseIn`, 500ms, translateY 7px + fade), max six then instant. Sorted soonest first.
Empty state: sprig sticker + "Nothing outstanding, every event is fully prepped."

### 6. Past Events
"Past Events" 500/24px, with term seals (F25 / S26 …) top-right: 36px squares, radius 8px, 1px border in
the term's colour, mono 9px label, hover ground at 8% of that colour.
Card grid, 1/2/3 columns responsive, 12px gap: 48px circular portrait (plain `#F0EDE4` circle when there
is no speaker) + name 500/13.5px, date/time 400/11.5px `#6E675C`, venue 400/11px `#B0A899`.
Cards lift 2px and darken their border on hover; stagger in at 70ms.
Empty: "No completed past events yet."

### 7. Photos
"Photos" 500/24px. Square tiles, 2/3/4 columns responsive, 12px gap, radius 9px, 1px border; image scales
to 1.04 over 380ms on hover; non-images show a mono `zip` / file label. Caption 400/10px `#B0A899` names
the event. Tiles stagger in at 60ms. Click → that event's details page.
Empty: dashed tile with the three-bloom flower cluster + "No media uploaded yet."

### 8. Notes
"Notes" 500/24px. Single bordered container, radius 11px, 22/24px padding, holding the block editor.
Title block 500/18px; paragraphs 400/13.5px, line-height 1.75, `#4A443C`; drag handles (⠿, `#E2DACB`)
live in a 22px negative-margin gutter and fade in on row hover (160ms) with the row ground going
`#FDFAF4`. Star sticker marks a flagged block. Highlighted text uses the gradient highlighter at 26%.
Caret is a 1.5px `#E8583D` bar; placeholder "Type '/' for commands" `#C9C4B6`.
Slash menu: 246px card, radius 10px, 1px border, shadow `0 14px 30px -18px rgba(35,32,28,.55)`; mono
section label, 12.5px rows, selected row on `#F5F0E5`.
Autosaves for Edit/Admin; View role renders read-only with no handles or slash menu.

### 9. Admin
"Admin" 500/24px + "Signed in as {name} · {email}" 400/12.5px `#6E675C`, prefixed by the current user's
avatar with the conic gradient bloom ring (inset −2px, blur 2px, 75% opacity).
Table (radius 10px, `#FFFDF9`): header row mono 9px uppercase `#B0A899`; columns Name (1.3fr) /
Email (1.6fr) / Access (0.9fr); rows 12px/15px, hover `#F5F0E5`. Name 12.5px (current user 500),
email 12px `#6E675C`. Access for an admin viewer is a role dropdown pill (mono 9.5px uppercase, 5px 9px,
radius 20px, 1px border, hover border `rgba(35,32,28,.32)` + text `#23201C`, "⌄" affordance in
`#B0A899`); the current user's own row shows a static pill on the gradient tint. Non-admin viewers get
static badges only.

## Interactions & behaviour
| Interaction | Spec |
| --- | --- |
| Row / ghost hover | ground → `#F5F0E5`, 180ms ease |
| Button hover (primary) | translateY(−2px) + shadow `0 9px 20px -10px rgba(232,88,61,.9)`, 200/300ms |
| Button press | scale(.975), 200ms |
| Secondary hover | ground `#F5F0E5`, border `rgba(35,32,28,.24)`, text `#23201C`, 260ms |
| Utility (mono) hover | letter-spacing .1em → .22em, 320ms `cubic-bezier(.2,.8,.2,1)` |
| Icon button hover | rotate(90deg), 340ms |
| Destructive hover | ground `rgba(232,88,61,.10)`, border `rgba(232,88,61,.3)` |
| Tab switch | indicator `top` 340ms `cubic-bezier(.2,.9,.2,1)`; panel fade-up 5px 340ms |
| Checkbox | stroke draw 360ms `cubic-bezier(.4,0,.2,1)` + label grey + 340ms strike sweep |
| Switch | knob 360ms `cubic-bezier(.34,1.6,.4,1)`, track colour 320ms |
| Drop zone | border 260ms; bloom opacity 400ms / rise 500ms |
| List mount | 70ms stagger, `riseIn` 500ms, cap six items |
| Sticker click | own 620ms pop `cubic-bezier(.34,1.5,.4,1)` — **per sticker, never a global trigger** |
| Sticker drift | float keyframes, 11–18s, ease-in-out infinite, ±6–14px |
| Calendar grid | no motion on cells themselves; chips only |
| Reduced motion | honour `prefers-reduced-motion`: keep colour/opacity changes, drop drift, stagger and pop |

## State management
- `activeSection` (event details) — index into the visible section list; drives indicator `top`, panel
  content, panel re-animation.
- `sectionDone{}` — per-section boolean; drives checkbox, green dot, "{n} of 9 done" pill, Todo pills.
- `needs{}` — the seven step-1 switches; determines which section tabs exist in step 2.
- `avatarMenuOpen`, `halalOn`, `seriesGenerated`, `role` (view/edit/admin gates editing).
- `stickerPop{}` — keyed per sticker id so each animates alone.
- Data fetching is unchanged from the current app.

## Design tokens
See `BRAND_KIT.md` for the full list, `brand-tokens.css` for CSS custom properties and
`tailwind.brand.js` for the Tailwind extension. Summary:
paper `#FFFDF9` / page `#FDFAF4` / hover `#F5F0E5` / line `#E2DACB` / faint `#B0A899` /
body `#6E675C` / strong `#4A443C` / ink `#23201C`; accents coral `#E8583D`, amber `#E0B94A`,
teal `#3FA789`, blue `#3B6FC2`, destructive `#B4472F`; radii 6/8/9/11/20/24px; type Hanken Grotesk
(300/400/500 only) + Geist Mono for time, dates, tags and ids.

## Assets
No bitmaps. The mark, stickers, blooms and washes are pure CSS (clip-path triangles, blurred radial
gradients, conic gradients). Photo and portrait placeholders are diagonal striped gradients — replace with
real uploads. Fonts: Hanken Grotesk and Geist Mono from Google Fonts. The Google "G" in the login button
should use the real Google mark asset in production.

## Files
- `CEC Brand Kit.dc.html`
- `CEC Pages.dc.html`
- `BRAND_KIT.md`
- `CLAUDE.md`
- `brand-tokens.css`
- `tailwind.brand.js`
