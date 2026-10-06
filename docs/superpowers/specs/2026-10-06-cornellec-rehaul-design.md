# CEC Dashboard: full visual rehaul to match cornellec.com

Date: 2026-10-06. Branch: `feat/cornellec-rehaul`.

## Why
The v1 brand kit (cream paper, warm greys, four-stop CENT gradient, airbrushed stickers) is what made the
dashboard feel heavy to use: the colour was everywhere. The club's public site, cornellec.com, is the
opposite: white, black, one mint accent, hard 2px borders, Space Grotesk display type, and the logo's
own pastel triangles as the only ornament. The dashboard should look like a page of that site.

Information architecture, routes, data and behaviour do not change. Only the surface does.

## What cornellec.com actually is (measured from the live site)
- Ground `#FFFFFF`, text `#000000`, body copy `#4A4A4A` (`text-subtle`), muted band `#E5E5E5`,
  hairline `rgba(0,0,0,.12)` (`border-line`), muted text as `foreground/40-55`.
- Accent mint `#3DFFA2`, mint-dark `#00CC6A` (for text on white), selection `#A8FFD4`, red `#FF0000`.
- Display: Space Grotesk 700 (uppercase, `tracking-tight` on big heads). Body: DM Sans 400/500/600.
  No monospace face anywhere. Labels are Space Grotesk uppercase with `tracking-wide` / `tracking-[0.2em]`.
- Radius 0 everywhere. Buttons: 2px black border (`.brutalist-border`), uppercase Space Grotesk,
  mint fill for the primary, transparent for the secondary, hover inverts to black.
- Cards: 1px `line` border, `shadow-soft` (`0 1px 2px rgba(0,0,0,.05), 0 10px 28px -14px rgba(0,0,0,.14)`);
  interactive cards hover to a black border, `4px 4px 0 #3DFFA2` hard shadow and `-translate-y-1`,
  300ms `cubic-bezier(.22,1,.36,1)` (`ease-fluid`).
- Nav: fixed, `bg-white/70 backdrop-blur-md border-b line`, links Space Grotesk uppercase, the active
  one carries a 2px mint underline.
- Motion: intro plane (`introLift` .5s `cubic-bezier(.76,0,.24,1)`), mark fade (`introMark` .45s),
  marquee strip (`heroMarquee` 45s linear, `text-mint-dark/35`, masked edges), colour transitions 200ms.
- Ornament: the logo's triangle tiles scattered at low opacity behind the hero; a short mint rule
  under section heads; black and grey full-bleed bands.

## Design decisions
1. **Token layer, not a rename.** Every component already reads `paper/page/ink/body/faint/line/...`
   and `coral/amber/teal/blue`. Those names stay as the compatibility layer and are repointed in
   `design/brand-tokens.css`; new site-native names (`mint`, `mint-dark`, `subtle`, `muted`, `line`,
   `font-display`, `shadow-soft`, `shadow-mint`, `ease-fluid`) are added for new and touched code.
   `paper` and `page` are both white; card edges come from borders and shadow, not ground colour.
2. **Fonts.** DM Sans replaces Hanken Grotesk as `--font-sans`. Space Grotesk is `--font-display` and
   also `--font-mono`, so the 128 existing "mono micro-label" sites become the site's uppercase
   display labels with no edits. Geist Mono is removed. Weights allowed: DM Sans 400/500/600,
   Space Grotesk 500/700. The old "nothing above 500" rule is gone.
3. **Shape.** All radius tokens go to 0, including shadcn `--radius`. Avatars become squares. Checkbox:
   16px square, 2px black border, mint fill and black check. Switch: 40x22 rectangle, 2px border,
   black square knob, mint track when on. Tags: 1px line border, display label, no radius.
4. **Accent.** The CENT gradient is gone. `--cent` is solid mint, `--cent-tint` mint at 18%,
   `--cent-pastel` `#A8FFD4`. Section colours stay as a system but are pulled from the logo tiles:
   coral `#D95070`, amber `#E8B830`, teal `#2A9D8F`, blue `#3B6FC2`. Section flags remain triangles.
   Destructive is `#FF0000`.
5. **Stickers are retired.** `components/stickers/` becomes `components/decor/` with:
   `TriangleScatter` (flat logo-tile triangles at 15-30% opacity, deterministic positions, each
   click-poppable), `Tri`, `TriRow` (four small section-coloured triangles, replaces BeadRow),
   `MintRule` (the 4px mint bar under titles), `Marquee`, `Seal` (2px-border square, display label),
   `Confetti` (triangle burst, flat). Flower, StarPolygon, TwinkleDiamondPair, CrescentMoon, Sprig,
   Heart, Sparkle, Cherries, Bow, CloudPuff, HighlighterBar and the calendar sun are deleted.
   `Sticker.tsx` (drift + click pop) survives for the triangles, drift amplitude halved.
6. **Shell.** Sidebar stays (18 destinations do not fit a top bar) but is white with a 1px right line,
   the stacked "CORNELL ENTREPRENEURSHIP CLUB" wordmark in Space Grotesk 700 uppercase next to the
   mark, group eyebrows in display 11px `tracking-[0.2em] text-foreground/40`, items in DM Sans 14px
   `text-foreground/55` hover black; the active item's label carries the 2px mint underline. Avatar is
   a 32px square with a 2px black border. The canvas letterbox, radial gradient, noise texture,
   `SidebarSeam` lace and the `zoom: 1.08` hack are all removed; content is `max-w-[1200px] px-12 py-10`
   on plain white.
7. **Intro plane.** A black full-screen plane with the mark lifts away on the first authenticated
   page load per session (sessionStorage gate), and on Login. Skipped under reduced motion.
8. **Page header.** `components/ui/page-header.tsx`: optional eyebrow, Space Grotesk 700 uppercase
   32px title, 4px mint rule, actions slot. Replaces the 27 hand-written `font-medium` h1s.
9. **Calendar.** FullCalendar: white cells, 1px line grid, weekday header `bg-muted` display label,
   today cell outlined 2px black with the day number mint-underlined, chips white with a 3px
   section-colour left bar, hover black border + `shadow-mint-sm`. No cell motion.
10. **Motion table v2.** 150ms colour, 200ms buttons, 300ms card lift, 340ms tab indicator / panel
    fade, 500ms list `riseIn` stagger (unchanged), 620ms triangle pop, 45s marquee. Default easing
    `cubic-bezier(.22,1,.36,1)`. `prefers-reduced-motion` drops drift, stagger, pop, intro, marquee.

## Files
- Foundation: `app/layout.tsx`, `app/globals.css`, `design/brand-tokens.css`, `design/tailwind.brand.js`,
  `design/BRAND_KIT.md` (rewritten as v2, with a changelog entry), `CLAUDE.md` non-negotiables,
  every file in `components/ui/`, `components/decor/*`, `components/app-shell/*`, `app/login/page.tsx`.
- Sweep (per page group, after the foundation lands): replace sticker imports with decor, hand-written
  h1s with `PageHeader`, `rounded-full` on non-avatars with square, leftover warm literals with tokens.
- A repo-wide replace of `rgba(35,32,28,` with `rgba(0,0,0,` keeps the 154 hairline opacities and lands
  them on the site's black.

## Verification
`npx tsc --noEmit`, `npm run lint`, `npm run test`, then every route rendered in a browser at 1280px
and 390px against the site's own pages.
