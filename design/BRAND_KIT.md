# CEC Dashboard — brand kit v1

Source of truth: `CEC Brand Kit.dc.html`. This file is the text version; keep both in sync.

## Voice of the design
Cream paper, grey text, one bright thing. Hierarchy comes from size and grey value, **not** weight —
500 is the heaviest weight anywhere. Colour is spent only where it means something: the mark, a done
state, a section flag, today. Everything else is neutral.

## Colour

### Neutrals (warm)
| Token | Hex | Use |
| --- | --- | --- |
| `paper` | #FFFDF9 | cards, inputs, table bodies |
| `page` | #FDFAF4 | page ground |
| `hover` | #F5F0E5 | row / ghost hover wash |
| `line-strong` | #E2DACB | switch off-track, dividers that must read |
| `faint` | #B0A899 | muted labels, placeholders, captions |
| `body` | #6E675C | body copy, secondary labels |
| `strong` | #4A443C | emphasis inside prose, editor text |
| `ink` | #23201C | titles, primary button ground, active tab |
| `faded` | #C9C4B6 | adjacent-month calendar days, disabled dots/placeholders |
| `portrait-placeholder` | #F0EDE4 | Past Events avatar circle when there's no speaker |
| hairline | rgba(35,32,28,.07–.14) | borders (.07 cards, .09 rules, .14 inputs) |

### Accents (the CENT gradient stops)
| Token | Hex | Section |
| --- | --- | --- |
| `coral` | #E8583D | Speaker, Marketing |
| `amber` | #E0B94A | Food, Notes |
| `teal` | #3FA789 | Venue, Attendees, Media, done-dot |
| `blue` | #3B6FC2 | Money, Recurring |
| `destructive` | #B4472F | delete text |
| `coral-bloom` | #F0836B | login sticker S4's inner radial highlight only |

### The gradient
`linear-gradient(95deg,#E8583D,#E0B94A,#3FA789,#3B6FC2)`
- **Full strength:** the mark, progress fills, the active-tab underline, a checked checkbox, the avatar
  bloom ring (as a conic variant from 200deg).
- **Tint 10–24%:** done states, active section pill (15%), "done" badges (20%), highlighter (26%).
- **Pastel:** switches use `linear-gradient(95deg,#F3B5A6,#EFDCA8,#AEDACA,#B7CBEB)` when on;
  `#EAE4D7` when off.
- Never a full-bleed background, never behind body text at full strength.

## Type
- **Hanken Grotesk** — 300 / 400 / 500 only. No 600, no italics.
- **Geist Mono** — time, dates, section tags, ids, micro-labels. Uppercase, letter-spacing .10–.16em.

| Role | Spec |
| --- | --- |
| Page title | 500 / 24–27px / 1.2 / −0.022em |
| Section title | 400 / 19–20px / 1.25 / −0.014em |
| Subhead | 500 / 14–15px / 1.4 |
| Body | 400 / 13.5–14.5px / 1.75, colour `body` |
| UI label | 400 / 12–13px / 1.4 |
| Muted | 400 / 11.5–12.5px, colour `faint` |
| Mono micro | 400 / 9–10px, uppercase, tracking .13em, colour `faint` |

Emphasis = one 500-weight word in `ink`, or a 1px underlined link. Never a bold block.

## Mark & lockups
- Triangle: `clip-path: polygon(50% 0,100% 100%,0 100%)` filled with the gradient. Aspect ≈ 1.14:1.
- Primary lockup: 24×21px mark + "CEC Dashboard" 500/17px, 11px gap. Header uses 20×18px + 14.5px.
- Stacked: 34×30px mark over "CEC" 500/12px uppercase tracking .1em — login, favicon ≥32px.
- Outline: gradient triangle with a paper triangle inset equally, 3px bottom rule remaining — favicon 16px,
  print. **The inner triangle must be centred**, or the mark reads as a chevron.
- Mark on wash: mark over the bottom-anchored cloud wash — login only.
- Minimum mark size 15px wide. No Cornell red anywhere.

## Radii & elevation
6px chips/rows · 8px inputs, seals, tiles · 9px buttons, sticker cards · 10–11px cards and panels ·
20px pills/tags · 24px the login button · 50% avatars and checkboxes.
Only two shadows: primary-button hover glow `0 9px 20px -10px rgba(232,88,61,.9)` and floating menus
`0 12–14px 28–30px -16/-18px rgba(35,32,28,.5)`. No resting shadows on cards.

## Buttons
| Variant | Resting | Hover | Press |
| --- | --- | --- | --- |
| Primary | `ink` ground, `page` text, 10/19px, r9 | translateY(−2px) + coral glow | scale(.975) |
| Secondary | transparent, 1px .14 border, `body` text | ground `hover`, border .24, text `ink` | scale(.975) |
| Utility (mono) | `paper`, 1px .16 border, tracking .1em | tracking .22em, text `ink` | — |
| Icon 36px | `paper`, 1px .14 border | rotate(90deg) + ground `hover` | rotate + scale(.94) |
| Ghost | transparent, `faint` text | ground `hover`, text `ink` | — |
| Destructive | transparent, `#B4472F` text | ground coral 10%, border coral 30% | scale(.975) |

## Controls
- **Input:** 10/12px, r8, 1px .14 border, `paper` ground, 13.5px text; focus border `strong` + 3px
  `rgba(35,32,28,.05)` ring, 220ms.
- **Checkbox:** 19px circle, gradient fill when checked, white 1.8px check drawn by `stroke-dashoffset`
  14→0, 360ms; label → `faint` + 1px strike sweep 340ms.
- **Switch:** 38×21px, r12, pastel gradient on / `#EAE4D7` off, 17px white knob, 360ms spring.
- **Tag:** mono 10px uppercase, 5/10px, r20, 1px .12 border, `body` text, 7px section dot; the "done" tag
  drops the border and sits on the 20% gradient tint.
- **Vertical tabs:** 36px rows, absolute 15%-tint pill animated via `top`; done rows show a 6px teal dot.
- **Segmented control:** 1px .13 border, r8, active segment `ink`/`page`, mono 10px uppercase.

## Sticker library — ten in use
| Sticker | Placement |
| --- | --- |
| flower (coral) | decorative fields, page corners |
| sprig | Todo empty state, event-details header margin |
| sun | today's calendar cell, current month in year view |
| flags (4 triangles) | one per prep section, in nav rows, chips and tags |
| beads (4 dots) | per-event progress, role dots, divider ornament |
| highlighter | Notes — highlighted text |
| star | flagged Notes block, pinned items |
| confetti | all-sections-done banner |
| seal | Past Events term filters, archive marks |
| cloud wash | login art, week-view today column, header grounds |

**Reserve (not wired to any screen):** heart, sparkle, cherries, bow — seasonal or one-off use.

### Sticker rules
- Built from blurred radial gradients (petals), clip-path polygons (triangle, star, sparkle) and conic
  gradients (ring, pinwheel). Keep them CSS — no bitmap exports.
- **Functional** stickers (flags, beads, sun, confetti, seal, highlighter) render at full strength.
- **Decorative** stickers render at 6–12% effective opacity, always blurred, always *behind* content, and
  content sits on ≥70%-opaque paper above them.
- One decor moment per screen. Forms, Admin and the Notes editor body get none.
- Floating decor drifts 11–18s ease-in-out infinite, ±6–14px, and each sticker owns its own 620ms
  `cubic-bezier(.34,1.5,.4,1)` pop on click. Never trigger all of them from one click.

## Motion
| Duration | Applies to |
| --- | --- |
| 160–180ms | hover washes, handles fading in, ghost buttons |
| 200–260ms | lifts, tints, borders, presses (scale .975) |
| 340–360ms | tab indicator, check stroke, panel fade-up, switch knob |
| 400–500ms | drop-zone bloom, stagger items |
| 620ms | sticker pop |
| 11–18s | ambient sticker drift |

Easings: `cubic-bezier(.2,.8,.2,1)` default · `cubic-bezier(.2,.9,.2,1)` tab indicator ·
`cubic-bezier(.34,1.6,.4,1)` switches (only spring) · `cubic-bezier(.4,0,.2,1)` check draw ·
`cubic-bezier(.34,1.5,.4,1)` sticker pop.
No motion on calendar cells. Respect `prefers-reduced-motion`.

## Implementation gotchas learned while prototyping
1. Animate the tab indicator with `top`, not `transform`.
2. Put `stroke-dashoffset` on the SVG **attribute** and transition it there; a CSS string with a
   hyphenated property in a style object silently drops.
3. A strikethrough overlay needs `display:inline-block` on the label so the absolute rule resolves.
4. Give the lightest swatches a hairline border or they vanish on cream.
5. The outline mark's inner triangle must be centred with a visible bottom rule.

## Changelog
- **Shell reverted to the literal header lockup.** A prior pass scaled the header mark/wordmark
  (to 26×30px/19px), avatar (36px) and tab-row text (14.5px) up past the kit's documented "Header"
  lockup, reasoning the mockup's 20×18px/14.5px/32px/13px values were tuned for a 1180px preview
  card and read too small at real full-bleed viewport widths. A CHECKLIST.md § Shell audit
  reinstated the literal spec values (mark 20×18px, wordmark 500/14.5px/−0.012em, avatar 32px,
  tab-row 400/500 13px) for exact fidelity. The same proportion argument still applies to the
  Calendar view (day numbers, weekday header, toolbar, event chips remain sized up per commit
  `88d4f17`) — that screen wasn't in scope for this pass and is unchanged.
- **Added `coral-bloom` (#F0836B).** The mockup's S4 sticker used this lighter/warmer coral shade
  for its inner radial highlight but it was never promoted to a token — it shipped as a raw hex
  literal in the Login page. Documented it here and in `brand-tokens.css` instead of approximating
  it away, since it's a real, intentional design decision, not an accident.
- **Wired up click-to-pop on the Login stickers.** All 7 background stickers plus the mark were
  rendering drift-only; the mockup wires `onClick` + a one-shot 620ms pop (scale/rotate) on each,
  matching CHECKLIST.md § Login and the kit's sticker rule ("each sticker animates on its own
  click"). The `--animate-pop` utility already existed in `globals.css` but had zero usages
  anywhere in the app before this.
- **Added `faded` (#C9C4B6).** Recurring across Calendar (adjacent-month days), Notes (placeholder/
  caret) and Admin (view-role dot) but never promoted to a token — shipped as a raw hex literal
  each time. Documented once here.
- **Calendar reverted to the literal kit spec.** Toolbar (31px prev/next, 17px title, 10px
  segmented-control text), day numbers (11.5px), event chips (4/7px padding, 10.5px text) and the
  today sun-sticker (15px) all carried the same real-viewport scale-up as the shell; reverted to
  the literal values per the established shell precedent. The decor bloom field's positions/sizes/
  alphas were also scaled up (and the container opacity bumped from .45 to .70) — reverted to the
  mockup's exact values.
- **Fixed: event-chip section triangle was always teal.** `firstPrepSection()` (new helper in
  `lib/utils/section-colors.ts`) picks the first *optional* prep section enabled on an event
  (speaker → attendees → money → food → marketing → media → recurring), falling back to Venue only
  if none are set — Venue itself is excluded from the priority order since it's unconditional on
  every event and would otherwise make every chip read as teal regardless. Threaded through to the
  month view's event-dot, the week view's tinted block, and the year view's bead — this was the
  "defaults to teal" gap noted from the original restyle pass.
- **Fixed: the month-view chip triangle never rendered at all**, independent of the colour bug.
  `eventDisplay="block"` (FullCalendar) suppresses the dot element entirely; switched to
  `"list-item"` so `.fc-daygrid-event-dot` has something to attach to. Also caught FullCalendar's
  own default `font-weight: bold` on `.fc-event-title`, which slipped past the "no weights above
  500" rule until this switch made the title visible enough to notice.
- **Added the S8-S10 calendar stickers** (teal flower, sparkle, twinkle diamond) present in the
  mockup's calendar frame but not yet built — same click-to-pop pattern as Login.
- **Week/Year view dimensions corrected to the mockup** (44px gutter not 56px, 52px rows not 60px,
  26px header not 32px) and their hardcoded `bg-teal`/`border-teal` replaced with the same
  `firstPrepSection()` colour used in month view.
- **Event details, step 2 — this screen was already very close to spec** (header card, left-rail
  tabs, the animated pill, the done-checkbox's stroke-draw, and every section's field list all
  already matched CHECKLIST.md § "Event details · step 2" exactly). Fixes:
  - Marketing's channel checkboxes were the shared `ui/checkbox.tsx` primitive at 16px/r4 instead
    of the mockup's 17px/r5, with a `.14`-opacity border instead of `.2`; also added the
    checked→ink / unchecked→body label colour the mockup uses to distinguish selected channels
    (previously no colour change at all), and removed the "Add" button's icon and the "Add a
    custom channel…" input's oversized styling to match the mockup's plain-text, compact version.
  - Two raw hex literals: the done-checkbox's SVG stroke (`#FFFDF9` → `var(--paper)`) and the
    drop-zone hover bloom's first gradient stop (`#E8583D` → `var(--coral)`).
  - Drop zone radius was `rounded-input` (8px); the kit specifies 10px for this component
    specifically (distinct from the 58px thumbnail tiles, which correctly stay at 8px).
  - Money's and Recurring's two-field row gap was 16px (Tailwind's `gap-4`); the kit's "pair"
    template uses 12px.
  - Tightened remaining `text-xs`/`text-sm`/`text-muted-foreground` instances across the section
    files to explicit pixel values and `text-faint`, matching the fidelity pass applied elsewhere.
- **Todo — fixed a real formatting bug, not just styling.** The date/time column was rendering the
  raw ISO strings (`2026-07-24` · `17:43`) instead of the kit's `sep 18 · 5:30–7:00p` format. Added
  `lib/utils/format-event-time.ts` (shared with the calendar week view, which had its own
  never-exported copy of the same time-label logic) rather than duplicating it a third time. Also
  added the "capped at six, then instant" stagger rule the checklist calls for — rows past the 6th
  previously kept extending the `riseIn` delay indefinitely instead of appearing immediately — and
  converted the empty-state sprig sticker's raw hex to tokens.
- **Past Events — built the term-seal filter from scratch.** It was entirely missing (no F25/S26
  UI at all), the previously-noted deferred gap since there's no stored "term" column. Added
  `lib/utils/terms.ts`: derives a term from `event_date` (Aug-Dec is Fall of that year, Jan-Jul is
  Spring — CEC doesn't run summer programming, so the spring/summer boundary doesn't need its own
  bucket), fixed Fall→coral / Spring→teal. Rebuilt the page as a server component (data fetch) +
  new `components/past-events/PastEventsGrid.tsx` (client, holds the active-term filter state) —
  clicking a seal toggles filtering to that term, clicking again clears it. Also fixed the same
  raw-ISO-date-string bug Todo had, and added `portrait-placeholder` (#F0EDE4, the no-speaker
  avatar circle) as a token instead of a raw hex literal.
- **Photos.** Non-image tiles were unconditionally labelled `zip` regardless of actual file type —
  wrong for the `video/*` uploads Media also accepts. Added `fileTypeLabel()` to derive it from the
  file extension (falling back to mime-type/`file`). Also moved the hover-scale transition from the
  `<Image>` itself onto the tile wrapper (`group-hover`) so non-image tiles scale on hover too,
  matching the mockup's uniform tile treatment — previously only image tiles had the effect.
