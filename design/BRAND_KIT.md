# CEC Dashboard brand kit v2: the cornellec.com system

Source of truth: the live site, https://cornellec.com, measured from its compiled stylesheet on
2026-10-06. v1 (cream paper, CENT gradient, airbrushed stickers) is retired; its two HTML mockups stay
in this folder for history only and no longer describe the app.

## Voice of the design
White, black, one mint. Type does the work: Space Grotesk 700 set in uppercase for anything that
heads a thing, DM Sans for everything you read. Edges are hard (2px black on controls, 1px hairline
on surfaces) and nothing has a corner radius. Colour appears exactly where the site spends it: the
primary action, the active underline, the hard shadow on hover. The only ornament is the logo's own
tiles, scattered faintly, and a short mint rule under titles.

## Colour
| Token | Value | Use |
| --- | --- | --- |
| `white` / `background` | #FFFFFF | page and card ground (both; edges come from borders) |
| `black` / `foreground` | #000000 | titles, body headings, borders on controls |
| `subtle` | #4A4A4A | body copy |
| `foreground/55`, `/50`, `/40` | rgba(0,0,0,.55/.5/.4) | secondary text, placeholders, inactive nav |
| `muted` | #E5E5E5 | grey band: table header, section bands, disabled fills |
| `line` | rgba(0,0,0,.12) | every hairline |
| `mint` | #3DFFA2 | primary button fill, active underline, hard shadow, checked states |
| `mint-dark` | #00CC6A | mint as text or small marks on white (mint itself fails contrast) |
| `mint-soft` | #A8FFD4 | `::selection`, highlight, pastel tints |
| `red` / `destructive` | #FF0000 | destructive text and hover fill |

### Section colours (from the logo tiles, see `components/app-shell/BrandMark.tsx`)
| Token | Hex | Section |
| --- | --- | --- |
| `coral` | #D95070 | Speaker, Marketing |
| `amber` | #E8B830 | Food, Notes |
| `teal` | #2A9D8F | Venue, Attendees, Media |
| `blue` | #3B6FC2 | Money, Recurring |

Section colour appears as a flat 3px bar or a 12px square swatch, never as a tint behind text.

### Compatibility aliases
The v1 names (`paper`, `page`, `wash`, `ink`, `body`, `faint`, `strong`, `faded`, `line-*`, `cent`,
`cent-tint`, `cent-pastel`) still compile and resolve to v2 values (`design/brand-tokens.css`), so old
classes do not break. New and touched code uses the v2 names above. `paper` and `page` are both white;
never rely on them for contrast against each other.

## Type
- **Space Grotesk** (`font-display`, also `font-mono`): 700 for titles, 500 for labels. Uppercase.
- **DM Sans** (`font-sans`): 400 / 500 / 600. Never uppercase.
- No monospace face exists. Dates, ids and times are `t-eyebrow` with `tabular-nums`.

| Role | Spec |
| --- | --- |
| Page title | `t-display` 32 to 36px (`PageHeader`) |
| Hero (login, public pages) | `t-display` 56 to 104px, `text-balance` |
| Section / card title | `font-display` 700 / 18px / 1.2, normal case |
| Dialog title | `t-display` 22px |
| Eyebrow, column head, tag, date | `t-eyebrow`: display 500 / 11px / uppercase / tracking .2em |
| Body | `font-sans` 400 / 14px / 1.6, `subtle` |
| UI label | `font-sans` 400 / 13px, `foreground/55` |
| Field label | display 500 / 11px / uppercase / tracking .14em, `foreground/70` (`Label`) |
| Nav item | `font-sans` 14px, active 500 |
| Button | display 700 / 12px / uppercase / `tracking-wide` |

Emphasis inside prose is one 600-weight DM Sans word, or a `link-underline` link.

## Mark and lockups
- The mark is the real logo (`BrandMark.tsx`, `app/icon.svg`): subdivided triangle in the tile colours
  with a white centre. Its colours are literal and never retuned with the palette.
- Sidebar lockup: 26x24px mark + two-line "CORNELL / ENTREPRENEURSHIP CLUB" display 700 13px uppercase
  tracking-tight. Public pages use the same on one line at 14px.
- Minimum mark size 16px wide. No Cornell red anywhere.

## Shape and elevation
- Radius 0 everywhere, including avatars, checkboxes, tags, thumbnails and dialogs.
- Controls and emphasised frames: `border-2 border-foreground` (`brutalist-border`). Surfaces: `border
  border-line`.
- `shadow-soft` `0 1px 2px rgba(0,0,0,.05), 0 10px 28px -14px rgba(0,0,0,.14)` on cards and menus.
- `shadow-mint` `4px 4px 0 #3DFFA2` (hover on linked cards), `shadow-mint-sm` `2px 2px 0` (rows, chips),
  `shadow-mint-lg` `8px 8px 0` (dialogs). No other shadows.

## Buttons (`components/ui/button.tsx`)
| Variant | Resting | Hover |
| --- | --- | --- |
| default | mint fill, black 2px border, black text | black fill, mint text |
| outline | transparent, black 2px border | black fill, white text |
| secondary | white, hairline border | black border |
| ghost | no border, `foreground/60` | `muted/60` wash, black text |
| destructive | red text | red fill, white text |
| link | DM Sans 500, `link-underline` | mint underline grows in |
Press: `scale(.98)`. Focus: 2px mint ring, 2px offset. Sizes: xs 28, sm 32, default 36, lg 44px.

## Controls
- **Input / Textarea / Select trigger / Date and time pickers:** 1px `line`, white, 14px DM Sans; hover
  `foreground/40` border; focus and open state `foreground` border. No ring, no glow.
- **Checkbox:** 16px square, 2px black border; checked fills mint with a 3.5-stroke black check.
- **Switch:** 40x22 rectangle, 2px black border, 14px black square knob; mint track when on. 200ms.
- **Tag / Badge:** 22px tall, `t-eyebrow` text, 1px border. `default` black fill, `mint` for done or
  active, `outline` hairline, `destructive` red text.
- **Table:** 1px hairline frame; header row on `muted` with `t-eyebrow` heads and a black rule under it;
  rows hairline-separated, hover `muted/40`.
- **Vertical tabs:** hairline left rule, a 3px mint bar on the active row animated via `top` (340ms,
  `ease-fluid`), active label 500 black. Done rows show a 6px `mint-dark` square.
- **Segmented control:** `border-2 border-foreground` group, `t-eyebrow` segments, active segment black
  fill white text.
- **Menus, popovers, selects:** 1px black border, white, `shadow-soft`, items 13px `subtle` hover
  `muted/60` wash and black text; group labels `t-eyebrow` at `foreground/50`.
- **Dialog:** 2px black border, `shadow-mint-lg`, `t-display` title, footer on `muted/40`.
- **Avatar:** square, 2px black border, initials in display 700 11px on `muted`.
- **Drop zone:** 2px dashed `line`, hover black border and `mint/10` wash. Thumbnails square, hairline.
- **Confirm (inline):** a bordered `t-eyebrow` tag with the yes in red, cancel in `foreground/60`.
- **Page header** (`components/ui/page-header.tsx`): eyebrow, `t-display` title, 4px x 80px mint rule,
  description, actions on the right. Every screen inside the shell starts with it.

## Decor (`components/decor/`)
The site's ornament is its own logo exploded into flat pastel triangles behind the hero, a short mint
rule under heads, and a marquee strip of tracked words. That is all we draw.
- `TriangleScatter`: 4 to 9 flat triangles in the tile colours at 18 to 30% opacity, deterministic
  positions by `seed`, each drifting slowly (half the v1 amplitude) and popping 620ms on its own click.
  One per screen, behind content, inside a `relative` box, with content in `relative z-10` if they
  overlap. Never over the Notes editor or any text input.
- `MintRule`: the 4px mint bar. `PageHeader` draws it; section heads may too.
- `Marquee`: 45s linear loop, display 500 12px uppercase tracking .2em at `mint-dark/35`, masked edges.
  Login, check-in and the public chat page only.
- `TriRow`: four small section-coloured triangles (sidebar foot, Admin, Sign-ins).
- `Seal`: 2px square in the term colour with a display label; active gets a 14% fill and a 3px hard
  shadow in the same colour.
- `Confetti`: six flat triangles for done states (all sections done, bingo, check-in success).
- `Tri`: one triangle, used as the section flag everywhere (event chips, Todo pills, tabs).
Deleted: Flower, StarPolygon, TwinkleDiamondPair, CrescentMoon, Sprig, Heart, Sparkle, Cherries, Bow,
CloudPuff, HighlighterBar, BeadRow, the calendar sun, every blurred radial "bloom" and "cloud wash".

## Motion
| Duration | Applies to |
| --- | --- |
| 150ms | colour changes: hover washes, text colour |
| 200ms | buttons, borders, switch knob, checkbox fill |
| 300ms | linked-card lift (`-translate-y-1` + `shadow-mint` + black border) |
| 340ms | tab indicator `top`, panel `fadeUp` |
| 500ms | list `riseIn` stagger (70ms steps, capped at six, then instant) |
| 500ms | intro plane `introLift` (`cubic-bezier(.76,0,.24,1)`), mark `introMark` 450ms |
| 620ms | triangle pop on click (`cubic-bezier(.34,1.5,.4,1)`) |
| 12 to 18s | triangle drift, plus or minus 4 to 7px |
| 45s | marquee, linear |

Default easing `cubic-bezier(.22,1,.36,1)` (`ease-fluid`). No motion on calendar cells; chips lift
on hover only. The intro plane plays once per browser session (sessionStorage) on the first full
load, never on in-app navigation. `prefers-reduced-motion` drops drift, stagger, pop, intro and the
marquee; colour and border transitions stay.

## Shell
- Sidebar 264px (68px icon rail under `md`), white, 1px `line` right edge. Lockup, search input, grouped
  nav with `t-eyebrow` group heads at `foreground/40`, items 14px at `foreground/55` hover black; the
  active item's label carries a 2px mint underline (`shadow-[inset_0_-2px_0_0_var(--mint)]`), the rail
  shows it under the icon. Foot: `TriRow` + square avatar opening the account menu.
- Content: plain white, `max-w-[1240px]`, 40 to 56px side padding. No letterbox, no canvas colour, no
  texture, no zoom.
- Login and the public pages (check-in, chat sign-up, student apply) have no sidebar: a hairline header
  row with the lockup, the hero title, the marquee, and a scatter behind.

## Calendar
Month grid (`.fc-cec` in `globals.css`): 1px black frame, hairline cells, weekday row on `muted` in
`t-eyebrow`, day numbers display 500 12px, adjacent-month cells `#FAFAFA`. Today: 2px black inset
outline and a mint underline under the number. Chips: white, hairline, 3px section-colour left bar,
hover black border + `shadow-mint-sm` + 1px lift. Week view: today column `muted/30`, blocks as chips.
Year view: hairline month tiles, current month 2px black, `size-1.5` section-colour squares per event.

## Implementation gotchas
1. Animate the tab indicator with `top`, not `transform`.
2. `--cent`, `--cent-tint`, `--cent-pastel` are `linear-gradient(mint, mint)` so `bg-cent*` utilities
   still produce a valid `background-image`. Prefer `bg-mint` / `bg-mint/20` in new code.
3. `font-mono` is Space Grotesk. Add `tabular-nums` where digits must line up.
4. The intro plane is server-rendered visible so the first paint is black, then removed in an effect if
   already seen; without that the page flashes before the plane appears.
5. `TriangleScatter` positions come from a seeded LCG, not `Math.random()`, or hydration fails.
6. BlockNote's suggestion menu and editor gutter need `!important` overrides (Mantine injects later).

## Changelog
- **2026-10-06, v2.** Whole surface rebuilt to match cornellec.com, per
  `docs/superpowers/specs/2026-10-06-cornellec-rehaul-design.md`. Fonts Hanken Grotesk and Geist Mono
  replaced by DM Sans and Space Grotesk; cream palette replaced by white/black/mint; the CENT gradient
  removed; all radii set to 0; shadcn primitives restyled with 2px black borders and hard mint shadows;
  the sticker library deleted in favour of `components/decor/` (triangle scatter, mint rule, marquee);
  the shell's canvas letterbox, noise texture, seam lace and zoom hack removed; an intro plane and
  `PageHeader` added; FullCalendar and BlockNote restyled. Section colours retuned to the logo tiles.
  v1 token names remain as aliases so untouched code keeps compiling.
