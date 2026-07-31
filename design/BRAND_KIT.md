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
- Sidebar lockup (2026-07-30, replaces the old top-header lockup): 21×24px mark + a two-line "CEC / Dashboard"
  16px/1.15/−0.014em wordmark, 10px gap, sitting at the top of the 228px nav sidebar — see changelog. Both
  mark and wordmark are click-poppable and link home.
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
- **Date/time picker:** `components/ui/date-picker.tsx` / `time-picker.tsx` — same trigger chrome as
  Input (r8, `.14` border, `paper` ground) plus a leading 14px faint icon, opening a `Popover`. Date side
  is `react-day-picker` restyled via `components/ui/calendar.tsx`: mono 9.5px uppercase weekday row, 36px
  day cells, selected day filled with the `--cent` gradient (paper text), today gets a 1px ink inset ring
  instead of a fill so it doesn't compete with selection. Time side is a scrollable 15-minute-increment
  list in a 132px popover, active row filled `--cent`. Replaces all native `<input type="date"/"time">` in
  event forms — the native control couldn't be restyled to match at all.
- **Auto-save + saved indicator:** `lib/hooks/use-autosave.ts` debounces a value (700ms) and calls a
  server action automatically; `components/events/SaveIndicator.tsx` renders a small mono 10px
  uppercase status (`Saving` spinner → `Saved` check, fading after 2s, or `Couldn't save` in
  `--destructive`) next to the field. Replaces manual per-section Save buttons on the event-details page.

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

**Former reserve, now wired in (2026-07-30):** heart, sparkle, cherries, bow — see changelog.

### Sticker rules
- Built from blurred radial gradients (petals), clip-path polygons (triangle, star, sparkle) and conic
  gradients (ring, pinwheel). Keep them CSS — no bitmap exports.
- **Functional** stickers (flags, beads, sun, confetti, seal, highlighter) render at full strength.
- **Decorative** stickers render big and obvious (2026-07-30: pushed well past the original 6–12% guidance —
  most are now 60–90px with 35–75% opacity; judge by feel, they should read as a deliberate visual element,
  not a barely-there texture), sized generously, always *behind* or clearly subordinate to content, on
  ≥70%-opaque paper. The Notes/DetailsForm exceptions that sit near editable fields stay lower-opacity and
  `pointer-events-none` specifically because they're adjacent to interactive controls, not as a general rule.
- **Every screen gets decor, no exceptions** — as of 2026-07-30 this includes forms (New Event, Event
  Details), Admin and the Notes editor. Multiple decor moments per screen are fine; keep them light enough
  that they read as texture, not clutter, and never let one sit over text a user needs to click through
  (see the Notes implementation note below).
- Floating decor drifts 11–18s ease-in-out infinite, ±6–14px, and each sticker owns its own 620ms
  `cubic-bezier(.34,1.5,.4,1)` pop on click. Never trigger all of them from one click. Where the kit's
  reference swatch also shows a hover micro-transition (rotate, scale, width/gap change), wire that too —
  stickers should react to both hover and click, not click alone.
- Shared implementation: `components/stickers/Sticker.tsx` (the float+pop wrapper) and
  `components/stickers/shapes.tsx` (the shape library, one component per sticker, sized/coloured to match
  the kit's reference swatches exactly). Use these instead of hand-rolling new inline sticker markup.
- A sticker placed over editable/interactive content (e.g. near the Notes editor) should be
  `pointer-events-none` and sit in its own `z-0` layer with the real content wrapped in `relative z-10` —
  don't let ambient decor intercept clicks meant for the content above it.

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
- **Notes — the slash menu was BlockNote/Mantine's rich default, not the kit's minimal spec.**
  It rendered icons, subtitles and keyboard-shortcut badges in grouped sections (a much busier
  layout than the mockup's plain single-line rows). BlockNote's theme API only covers colours, not
  this layout, so restyled it via its documented, stable class hooks (`bn-suggestion-menu`,
  `bn-mt-suggestion-menu-item-*`) in `globals.css` instead — hid the icon/subtitle/badge elements,
  sized the card to 246px/r10, and had to `!important` the box-shadow since Mantine's own
  runtime-injected shadow otherwise wins the cascade regardless of source order. Also: the
  placeholder was BlockNote's default "Enter text or type '/' for commands", not the kit's copy —
  overridden via the (non-deprecated) `dictionary` option — and `caret-color` (not exposed by the
  theme API either) was the default ink instead of coral. Converted the theme object's remaining
  raw hex to tokens.
- **Admin.** This screen was already very close to spec — grid columns, header row, hover, name/
  email sizes, the current-user gradient-tint pill, and the `RoleSelect` dropdown pill (border,
  hover-border, mono size, the "⌄" affordance colour) all already matched the checklist exactly.
  Fixed the avatar ring's conic-gradient raw hex → tokens, tightened the email column's `text-xs`
  to explicit `text-[12px]`, and added the "Non-admins see the same table with static role badges"
  footer caption from the mockup, which had been dropped (every other screen with an equivalent
  helper caption — Notes, Todo empty state — already had theirs).
- **Logo + header, and stickers everywhere (2026-07-30).** Explicit user direction to move past strict
  kit-literal fidelity on two fronts:
  - **Header.** Replaced the 20×18px primary lockup + 14.5px wordmark with the kit's "stacked" 34×30px
    mark sized up for the header, next to a 20px/−0.016em "CEC Dashboard" title. The mark is now a Link to
    `/calendar` and click-poppable, matching the Login mark's behaviour. Added a faint `CloudPuff` wash
    behind the header and a low-opacity `BeadRow` at the end of the nav row.
  - **Stickers.** Went from "one decor moment per screen, none on forms/Admin/Notes" to decor on every
    screen, including those three, per direct request ("use the stickers more, a lot more" / "put in forms
    too" / "+ admin + notes"). Extracted the previously-inline, copy-pasted-per-screen sticker markup (from
    Login and Calendar) into shared, reusable primitives: `components/stickers/Sticker.tsx` (float + 620ms
    click-pop wrapper) and `components/stickers/shapes.tsx` (one component per sticker shape, matching the
    kit's reference swatch sizes/colours exactly, including reserve stickers heart/sparkle/cherries/bow
    which weren't wired to anything before). Also added hover micro-transitions from the kit's swatch specs
    (rotate/scale/width/gap) that existing implementations hadn't wired up — stickers now react to hover
    *and* click. Wired into: Calendar (week/year views, previously undecorated; month view gained two more
    stickers), Todo (empty-state sprig now poppable; added corner decor to the populated list), Past Events
    (term-filter "seals" are now the real `Seal` sticker shape, Fall=coral/Spring=teal, plus a faint
    background flower), Photos (empty-state bloom now poppable; added corner decor to the populated grid),
    Event Details (header sprig now poppable; added a `Confetti` burst peeking out of the "N of M done"
    badge once all sections are done), New Event (added a corner star), Notes (added a corner star behind
    the editor — kept `pointer-events-none` with the editor wrapped in `relative z-10`, since a clickable
    sticker there would steal clicks meant for the rich-text body — plus a small hover-only highlighter bar
    by the footer caption), and Admin (added a small `BeadRow` next to the "Signed in as" line, doubling as
    the kit's own "beads — role dots" placement). Login was left as-is: already the densest screen (7
    stickers + the mark) and previously verified against the mockup, so it wasn't worth the regression risk
    for this pass.
- **Sidebar shell, enlarged calendar, canvas backdrop, bigger stickers (2026-07-30, second pass).**
  Iterated live against a reference screenshot the user took of `design/CEC Pages.dc.html` itself (the
  "02 · CALENDAR · MONTH (HOME)" caption gave it away) rather than guessing colours off a JPEG:
  - **App shell rebuilt as a left sidebar.** The old top header + horizontal nav row is gone; `AppShell.tsx`
    is now a 228px sidebar (brand lockup top, vertical nav with a gradient rail + `bg-cent-tint` pill on the
    active item, avatar/account menu bottom) beside the page content. This freed the header row's vertical
    space entirely.
  - **New `--canvas` token (`#EFEBE2`)**, pulled byte-for-byte from `CEC Pages.dc.html`'s own `<body>`
    background — not a guess, not reusing `--hover`. The whole app frame (sidebar + content) is now capped
    at 1360px and centered on this canvas colour, so wide viewports letterbox instead of the grid stretching
    into an oddly wide aspect ratio. Applies to every authenticated page via `AppShell`; Login is unchanged
    (it's already a deliberate full-bleed exception, see "Mark on wash" above).
  - **Calendar month view enlarged and corrected to match the mockup exactly, not approximated:** day
    numbers left-aligned (were right-aligned — FullCalendar's default `.fc-daygrid-day-top` is
    `justify-content: flex-end`, overridden to `flex-start`), day cells 94px → 122px, and the weekday header
    row's grey undertone is `rgba(35,32,28,.07)` applied directly to `.fc-col-header-cell` — this is the
    exact composited value of the mockup's own grid-container wash (`--hairline-soft`), not an invented flat
    colour. Event chips, the today-dot and the month title scaled up slightly to match.
  - **Every decorative sticker sized up significantly** ("bigger + obvious," direct request) — most moved
    from 26–64px/6–12% opacity to 46–110px/35–75% opacity. Calendar month view's hand-rolled S8/S9/S10 were
    also rebuilt on the shared `Flower`/`StarPolygon`/`TwinkleDiamondPair` components instead of duplicated
    inline markup, since they needed to scale anyway. The two stickers sitting near interactive
    controls/editable text (DetailsForm's header sprig, Notes' corner star) were bumped in size too but kept
    `pointer-events-none`/low-relative-opacity, since "bigger" there shouldn't mean "steals clicks or fights
    the text above it."
- **Recurring moved out of "what does this event need?", auto-save everywhere, styled date/time pickers,
  year view scale-up (2026-07-30, third pass).** Direct user feedback on the event-prep flow and calendar:
  - **Recurring is no longer a toggle-list item.** `ToggleForm.tsx` ("New event · step 1") now has a
    "Repeats" select (does not repeat / weekly / biweekly / monthly) directly under the Date/Start/End
    row, with an "Ends on" date field appearing inline once a frequency is picked. Diverges from
    `CEC Pages.dc.html`'s "03 · new event · step 1" mockup, which still shows Recurring as a switch in
    that list — the mockup wasn't updated for this, treat this file as the current source of truth for
    that screen instead. `generateRecurringOccurrences` now runs automatically inside `createEvent`
    (`lib/actions/events.ts`) the moment the event is saved, instead of requiring a second "Generate
    series" click on a separate tab in step 2. The Recurring tab in event-details still exists (evidence
    upload + done-marking for the series), it just no longer has a manual generate step for events
    created through this flow.
  - **Every manual per-section Save button on the event-details page is gone.** Venue, Speaker,
    Attendees, Money, Food, Notes, and the header (name/date/time) now auto-save 700ms after the last
    edit via `lib/hooks/use-autosave.ts`, showing a small `Saving…` / `✓ Saved` / `Couldn't save` label
    (`components/events/SaveIndicator.tsx`) next to the field instead of requiring a click. Marketing
    already auto-saved on toggle before this pass; it was the model for the rest.
  - **Native `<input type="date"/"time">` replaced everywhere** (new-event step 1, event-details header)
    with the styled `DatePicker`/`TimePicker` documented under Controls above — the native browser picker
    UI couldn't be made to match the kit at all.
  - **Week view event chips truncate with an ellipsis** instead of hard-clipping mid-word (no
    `truncate`/`min-w-0` on the old markup), and show a `title` tooltip with the full event name.
  - **Full "am"/"pm" everywhere a time is rendered** (`formatEventTime` in
    `lib/utils/format-event-time.ts`, plus FullCalendar's `eventTimeFormat` in month view) — was a bare
    `a`/`p` suffix. Week view's hour-gutter labels (`8a`, `9a`...) were left as the narrow form; that's a
    much smaller, denser label and reads fine abbreviated.
  - **Year view enlarged and centered, month/week left alone** (explicit ask — "keep month and week the
    same, only year needs work"). `YearView.tsx`'s grid gained `mx-auto w-full` (it had `max-w-[900px]`
    with no centering, so it always sat flush-left) plus bigger tiles/gaps/dots/type. The shared toolbar
    in `CalendarView.tsx` (prev/next/Today/segmented view control) now conditionally scales up only when
    `viewType === "year"`, matching the bigger grid; month and week keep the original toolbar size.
- **Recurring is no longer a section tab at all (2026-07-30, fourth pass).** Follow-up to the third
  pass — the "Recurring" tab (with its own Save/Mark-as-done/evidence-upload) is gone entirely from
  event details; `RecurringSection.tsx` is deleted. Instead, the event-details header (same card as
  Event name/Date/Start/End) grows a second row with `Repeats` + `Ends on` whenever the event is part
  of a series, auto-saving like every other field. Editing it calls `updateRecurringSeries`
  (`lib/actions/events.ts`), which only ever touches occurrences that haven't happened yet — the
  parent and anything on/before today are untouched; everything after is dropped and regenerated at
  the new frequency/end date. Since there's no more "done" checkbox for it, `event_recurring` rows are
  now inserted pre-satisfied (`done: true`) so recurrence can never block `events.is_complete` — no DB
  migration needed, the completion trigger already just reads that column.
- **Notes — dropped the second narrow column, the drag-handle side menu, and the boxed editor
  surface (2026-07-30).** The page had its own inner `max-w-[760px] mx-auto` wrapper on top of the
  app shell's already-narrower `max-w-[1120px]` content pane — no other screen double-narrows like
  this, so Notes read as a small island in a sea of empty canvas instead of filling the page like
  Calendar/Todo/Admin do. Removed that wrapper; the doc column now uses the same width as every
  other screen. Also disabled BlockNote's default side menu (`sideMenu={false}` on `BlockNoteView`)
  — the drag-handle/`+` button floated in the 8px gutter of the old narrow column and read as an
  awkward floating tab; the kit's minimal spec doesn't call for it anyway. Finally, the editor's
  `theme.colors.editor.background` was `var(--paper)`, a hair whiter than the page's `var(--page)`
  wash behind it — a barely-there but real color mismatch that made the text area read as its own
  boxed panel. Set to `transparent` so it blends into the page, and replaced the "this is the
  editable area" signal with a thin `bg-amber/50` vertical bar to the left of the doc (same
  `w-[2.5px] rounded-full` accent pattern as the sidebar's active-nav indicator), matching the
  Food/Notes amber section colour instead of a filled background.
- **Notes — text still sat indented from the "Notes" header (follow-up, 2026-07-30).** BlockNote's
  `.bn-editor` ships a hardcoded `padding-inline: 54px` (gutter reserved for its side menu, which is
  now disabled) — overridden in `globals.css` to `0` so body text starts flush with the header's
  left edge instead of ~54px in from it. The amber gutter bar moved from `left-0` inside a `pl-5`
  wrapper (which had been indenting the text to make room for it) to `-left-4` outside the now-flush
  text column, so it reads as a margin mark rather than pushing content over.
- **Member tagging lives in the header card, not the tab bar (2026-07-31).** Tagging club members
  onto an event (separate from the Luma-link `Attendees` tab) isn't a prep-task section — it's
  metadata about the event itself, same category as name/date/time. `TaggedMembersSection` renders
  as a labeled row directly in the event-details header card, below the start/end time fields
  (above the conditional Repeats row), not as its own tab — so it never got a fixed section colour
  and doesn't participate in the tab bar's done-dot/"N of M done" count at all.
