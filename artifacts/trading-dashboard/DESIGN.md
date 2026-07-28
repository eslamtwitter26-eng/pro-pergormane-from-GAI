# Design System — EG-Finance Fx Pro Analyser

A reference for keeping the interface coherent as the product grows.
Reading of the reference image: **the chrome should disappear.** In that
screenshot the frame is nearly invisible — flat dark panels, hairline
dividers, one accent colour used sparingly on a single primary action,
and generous quiet space. Nothing glows. Nothing competes with content.

Lineage: Apple HIG · Arc · Linear · TradingView Desktop.

---

## Colour

| Role | Token | Value |
|---|---|---|
| Background | `--background` | `#0B0F17` |
| Card / surface | `--card` | `#141A24` |
| Primary | `--primary` | `#3B82F6` |
| Accent | `--accent` | `#60A5FA` |
| Success | — | `#10B981` |
| Danger | `--destructive` | `#EF4444` |
| Warning | — | `#F59E0B` |
| Text primary | `--foreground` | `#FFFFFF` |
| Text secondary | `--muted-foreground` | `#94A3B8` |
| Hairline | `--hairline` | `rgba(255,255,255,0.06)` |

**Rule:** colour carries *meaning*, never decoration. Green/red only
ever encode profit and loss. Blue marks the active state and the single
primary action per view. Borders are always neutral hairlines — a
coloured border is a bug.

## Elevation

Five shadow tokens (`--shadow-xs` → `--shadow-xl`), all pure black at low
alpha and vertically offset. There are no coloured shadows, no glows, no
`drop-shadow` on icons or chart series.

- Resting card: `--shadow-sm`
- Hovered card: `--shadow-md` + `translateY(-4px)`
- Overlays / popovers: `--shadow-lg` / `--shadow-xl`

## Shape & space

- Card radius **18px** (`--radius`); nested chips 9–14px. Never mix.
- Card padding **24px**, equal on all sides. Header row 24px × 16px.
- Spacing follows a 4px grid; sections breathe at 32–40px.
- Page gutter 36px, content capped at 1520px.

## Typography

Inter, weights 400–600 only. `font-black`/`font-extrabold` are banned —
weight 600 is the ceiling, and hierarchy comes from size and colour.

| Use | Size / weight |
|---|---|
| Page title | 19px / 600, `-0.022em` |
| Section title | 14px / 600 |
| Metric value | 26px / 600, tabular |
| Body | 13px / 400 |
| Label, caption | 11–12px / 500, secondary colour |

No text is smaller than 11px. Micro-labels are sentence case, not
`UPPERCASE + letter-spacing`. All numerals use tabular figures so
columns and tickers never jitter.

## Navigation

A 68px icon rail, collapsed by default, expanding to 232px on hover over
280ms. Labels fade and slide 6px into place. The active item is marked by
a 2px primary rule animated between items with a shared `layoutId`.

## Charts

Charts are the interface; the card is a frame. Defined once in
`src/lib/chartTheme.ts` and imported — never re-styled inline.

- Horizontal-only grid at `rgba(148,163,184,0.1)`; no vertical rules.
- Axes: 11px `#94A3B8`, no tick marks, no axis lines.
- A zero reference line wherever values cross zero.
- Tooltips are solid `#141A24` panels with a hairline and `--shadow-lg`.
- Series animate in progressively over 900ms.
- Bars: 6px top radius, capped width, 0.9 fill opacity.

## Motion

Defined in `src/lib/motion.ts`. One curve — `cubic-bezier(0.16,1,0.3,1)` —
and short durations. Motion explains a state change; it never performs.

| Interaction | Spec |
|---|---|
| Page transition | 250ms fade + 8px rise |
| Card stagger | 80ms between children |
| Card hover | `y: -4px`, 240ms |
| Button hover | `y: -1px`; tap `scale: 0.985` |
| Icon hover | `rotate: -6deg`, 260ms |
| Sidebar expand | width 280ms |
| Upload idle | 3.6s breathing pulse |
| Numbers | 900ms cubic ease-out count-up |

`prefers-reduced-motion` collapses everything to near-zero.

## Anti-patterns

Neon or cyberpunk accents · purple glowing borders · heavy gradients ·
glassmorphism / `backdrop-blur` on cards · huge headings · coloured card
borders · `hover:scale` on cards (lift instead) · text-shadow or
drop-shadow glows · type below 11px.
