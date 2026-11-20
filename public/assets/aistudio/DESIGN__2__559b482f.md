---
name: Gordiyeh Architectural Luxury
colors:
  surface: '#001429'
  surface-dim: '#001429'
  surface-bright: '#223b56'
  surface-container-lowest: '#000f20'
  surface-container-low: '#001d36'
  surface-container: '#04213b'
  surface-container-high: '#112b46'
  surface-container-highest: '#1d3651'
  on-surface: '#d1e4ff'
  on-surface-variant: '#c6c6cc'
  inverse-surface: '#d1e4ff'
  inverse-on-surface: '#18324c'
  outline: '#909096'
  outline-variant: '#45464c'
  surface-tint: '#c1c6da'
  primary: '#c1c6da'
  on-primary: '#2a303f'
  primary-container: '#0d1321'
  on-primary-container: '#787e90'
  inverse-primary: '#585e6f'
  secondary: '#b7c7e5'
  on-secondary: '#213148'
  secondary-container: '#384760'
  on-secondary-container: '#a6b6d3'
  tertiary: '#abcae8'
  on-tertiary: '#12334b'
  tertiary-container: '#001525'
  on-tertiary-container: '#63819d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dde2f6'
  primary-fixed-dim: '#c1c6da'
  on-primary-fixed: '#151b2a'
  on-primary-fixed-variant: '#414657'
  secondary-fixed: '#d5e3ff'
  secondary-fixed-dim: '#b7c7e5'
  on-secondary-fixed: '#0b1c32'
  on-secondary-fixed-variant: '#384760'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#abcae8'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#2b4963'
  background: '#001429'
  on-background: '#d1e4ff'
  surface-variant: '#1d3651'
typography:
  headline-xl:
    fontFamily: Vollkorn
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 68px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Vollkorn
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Vollkorn
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-sm:
    fontFamily: Vollkorn
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.08em
  headline-lg-mobile:
    fontFamily: Vollkorn
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-xl-mobile:
    fontFamily: Vollkorn
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
spacing:
  gutter: 2rem
  margin: 3rem
  space-xs: 0.5rem
  space-sm: 1rem
  space-md: 1.5rem
  space-lg: 3rem
  space-xl: 5rem
---

## Brand & Style

This design system merges Dark Architectural Brutalism with refined luxury e-commerce, evoking a sense of monumental heritage, weight, and precision. The aesthetic relies on raw, heavy stone-like surfaces contrasted with sharp metallic framing, monumental proportions, and structural symmetry. It evokes awe, exclusivity, and timeless craftsmanship.

- **Brand Personality:** Monumental, uncompromising, majestic, precise.
- **Target Audience:** Connoisseurs of high-end Persian luxury goods, architectural artefacts, and bespoke fashion.
- **Emotional Response:** A sense of entering a timeless stone vault—imposing yet undeniably exquisite.

## Colors

The palette is anchored in deep obsidian and petroleum tones, drawing inspiration from ancient stone architecture and night skies, punctuated by warm parchment gold for high-contrast luxury focal points.

- **Primary (#0D1321):** Deep Obsidian used for primary canvas backgrounds.
- **Secondary (#1D2D44):** Petroleum for structured cards, elevated containers, and structural sections.
- **Tertiary (#3E5C76):** Steel Arch Stroke for high-precision borders, structural grid lines, and secondary interactive states.
- **Neutral (#748CAB):** Titanium Muted for secondary text, subtle iconography, and disabled states.
- **Accent (#F0EBD8):** Warm Ivory / Parchment Gold reserved for critical CTAs, active states, and headline highlights.

## Typography

Typography balances authoritative editorial serifs with razor-sharp geometric grotesks. Support for RTL (Persian) layouts is built-in, pairing Vazirmatn or Vollkorn Persian equivalents seamlessly with the Latin hierarchy.

- **Headlines:** Set in Vollkorn for an editorial, monumental tone.
- **Body:** Set in Be Vietnam Pro for pristine legibility across dense product descriptions.
- **Labels & Metas:** Set in Space Grotesk with wide letter-spacing for an architectural blueprint feel.

## Layout & Spacing

A rigid, architectural 12-column fluid grid system governs the layout, emphasizing monumental whitespace, structural symmetry, and absolute alignment.

- **Layout Model:** Fluid grid with generous outer margins (`margin: 3rem`) and stark column gutters (`gutter: 2rem`).
- **RTL Compliance:** Mirrors all grid flow, directional arrows, and navigation alignments seamlessly from right to left.
- **Breakpoints:** Desktop (1440px+), Tablet (768px - 1439px), Mobile (<767px) with proportional scaling of section margins.

## Elevation & Depth

Depth is achieved through structural layering and precise low-contrast framing rather than soft consumer drop-shadows.

- **Structural Borders:** Surfaces are delineated by crisp 1px strokes of Steel Arch Stroke (`#3E5C76`) against Obsidian backgrounds.
- **Tonal Stacking:** Elevation steps use solid petroleum steps (`#1D2D44`) stacked over obsidian (`#0D1321`) to create monolithic depth tiers.
- **Portal Arch Framing:** Selected hero containers employ architectural arch radii on top borders to mirror traditional Persian portal geometry.

## Shapes

The design system enforces strict architectural brutality with zero-radius (`0px`) corners across standard containers, cards, and input fields. 

- **Sharp Geometry:** Elements rely on strict 90-degree intersections to evoke stone masonry and industrial precision.
- **Portal Arch Exception:** Hero media containers and primary feature frames incorporate customized top-center arch geometry while maintaining razor-sharp structural base corners.

## Components

Components are engineered for brutalist weight and high-end luxury e-commerce conversion.

- **Buttons:** Solid Warm Ivory (`#F0EBD8`) rectangles with stark Obsidian text for primary actions; inverted transparent boxes with 1px Steel Arch Stroke (`#3E5C76`) for secondary actions. Zero border-radius.
- **Input Fields:** Deep Petroleum (`#1D2D44`) fields with a 1px Steel Arch Stroke. Focus states shift the border immediately to Warm Ivory with zero glow or blur.
- **Cards:** Monumental product cards featuring edge-to-edge photography, framed by thin steel strokes, with typography rigidly left-aligned (or right-aligned in RTL mode).
- **Checkboxes & Radios:** Sharp square containers with crisp inner fills upon selection. No rounded checkmarks.
- **Chips & Tags:** Uppercase monospace labels enclosed in 1px Titanium Muted borders with tight padding.
- **Portal Arch Banners:** Specialized hero containers featuring integrated archway SVG clip-paths for high-impact brand storytelling.