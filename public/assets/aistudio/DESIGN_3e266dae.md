---
name: Tactile Architectural Commerce
colors:
  surface: '#fff9e6'
  surface-dim: '#dfdac8'
  surface-bright: '#fff9e6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f4e0'
  surface-container: '#f3eedb'
  surface-container-high: '#ede8d5'
  surface-container-highest: '#e7e3d0'
  on-surface: '#1d1c10'
  on-surface-variant: '#45464c'
  inverse-surface: '#323124'
  inverse-on-surface: '#f6f1de'
  outline: '#76777d'
  outline-variant: '#c6c6cc'
  surface-tint: '#585e6f'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#151b2a'
  on-primary-container: '#7e8395'
  inverse-primary: '#c1c6da'
  secondary: '#43617c'
  on-secondary: '#ffffff'
  secondary-container: '#c1e0ff'
  on-secondary-container: '#46647e'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#001d36'
  on-tertiary-container: '#6e86a4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde2f6'
  primary-fixed-dim: '#c1c6da'
  on-primary-fixed: '#151b2a'
  on-primary-fixed-variant: '#414657'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#abcae8'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#2b4963'
  tertiary-fixed: '#d1e4ff'
  tertiary-fixed-dim: '#b0c8ea'
  on-tertiary-fixed: '#001d36'
  on-tertiary-fixed-variant: '#304864'
  background: '#fff9e6'
  on-background: '#1d1c10'
  surface-variant: '#e7e3d0'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.025em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
---

## Brand & Style
This design system embodies the culture of bespoke workspace curation, mechanical precision, and tactile every-day-carry (EDC) lifestyle gadgets. It marries high-end industrial design with editorial publishing depth, avoiding generic e-commerce tropes such as intrusive carousels, neon badges, and aggressive popups. 

The aesthetic is grounded in architectural minimalism and precision hardware: warm bone canvas surfaces provide an organic, premium desktop foundation, layered with deep obsidian navy typography and precision-machined slate petrol structural elements. The atmosphere feels deliberate, quiet, and obsessively curated—appealing to engineers, architects, designers, and creative directors who treat their workstations as physical extensions of their craft.

## Colors
The palette is derived directly from matte industrial finishes, anodized aluminum, and unbleached architectural paper:

- **Primary Canvas & Neutral (`#F0EBD8`)**: Warm Ecru Bone. Acts as the foundational canvas tone, reducing eye strain and evoking tactile materiality, textured desk pads, and premium paper stock rather than sterile digital white.
- **Primary Ink & Structural Deep Navy (`#0D1321`)**: Deep Obsidian Navy. Used for primary typography, authoritative CTA buttons, and dominant structural frames. Provides high-contrast clarity without harsh synthetic black.
- **Secondary Slate Petrol (`#1D2D44` & `#3E5C76`)**: Industrial Slate Petrol. Applied to sub-headers, active state accents, high-priority interactive components, technical spec labels, and secondary interactive buttons.
- **Tertiary Fog Petrol (`#748CAB`)**: Anodized Fog Petrol. Reserved for subtle micro-borders, inactive toggles, divider rules, and secondary meta labels.
- **Surface Elevation Variables**:
  - `surface-base`: `#F0EBD8`
  - `surface-raised`: `#F7F4EB`
  - `surface-sunken`: `#E5DFC9`
  - `border-hairline`: `rgba(29, 45, 68, 0.12)`
  - `border-focus`: `#1D2D44`

## Typography
The typographical hierarchy balances structured editorial clarity with technical product precision.

- **Primary Latin Font**: Plus Jakarta Sans delivers geometric precision balanced by subtle warmth in its apertures, pairing seamlessly with technical gadget photography and product specifications.
- **Multilingual & RTL Fallback**: For Persian/Arabic scripts, paired components fall back to Vazirmatn at matching weight intervals (Light 300 through Bold 700) with a 0.95 scale factor to preserve balanced baselines.
- **Case and Tracking**: Display and headlines employ tightened letter-spacing (`-0.015em` to `-0.03em`) for a premium editorial rhythm. Technical identifiers, spec tags, categories, and inventory statuses use uppercase tracking (`0.06em` to `0.08em`) to mimic machined product serials.

## Layout & Spacing
The layout follows an unyielding editorial grid system designed around intentional discovery rather than kinetic carousels or infinite lazy-load clutter.

- **Grid Framework**:
  - **Desktop (1200px+)**: 12-column layout with 32px (`2rem`) gutters, max-width constrained to 1440px with generous margins.
  - **Tablet (768px - 1199px)**: 8-column layout with 24px (`1.5rem`) gutters.
  - **Mobile (< 768px)**: 4-column layout with 16px (`1rem`) gutters and safe edge margins.
- **Editorial Zero-Slider Philosophy**: In place of rotating banners and interactive hero sliders, products and editorial features exist in stacked modular bays and paired split-scrolling frames. Product galleries utilize sticky viewport side-by-side details with synchronized vertical image stacking.
- **Rhythm & Cadence**: Component interiors maintain strict multiples of 4px/8px. Generous micro-gutters isolate high-density technical specs, preventing visual clutter around checkout pathways.

## Elevation & Depth
Depth is realized strictly through **tactile tonal layering and micro-borders** rather than heavy blurred shadows.

- **Micro-Border Framing**: Surfaces are bounded by ultra-fine 1px hairpins tinted in `rgba(29, 45, 68, 0.12)`. When elements encounter hover or focus, borders transition to `#1D2D44` or `#3E5C76`.
- **Tonal Stepping**: 
  - Canvas floor sits at `#F0EBD8`.
  - Cards, side panels, and elevated modular cards lift cleanly onto `#F7F4EB`.
  - Inset trays, spec tables, and input wells depress into `#E5DFC9`.
- **Ambient Shadow Discipline**: Only floating utility overlays (cart flyout drawers, sticky buy navigation dock, contextual tooltips) utilize shadows:
  - Blur radius: 16px to 24px.
  - Color & opacity: `rgba(13, 19, 33, 0.08)`.
  - Offset: 0px X, 8px Y.

## Shapes
To reinforce the CNC-machined aluminum and architectural feel of desk gear, the shape language uses low, crisp radii (Soft / `roundedness: 1`):

- **Micro Radii (2px - 4px)**: Badges, technical specification pills, input fields, checkboxes, and segmented toggles.
- **Core Component Radii (4px - 6px)**: Primary buttons, product display cards, modal containers, and drawer panels.
- **No Circular Bubbles**: Circular elements are reserved strictly for circular hardware swatches (color finish discs) and indicator status dots.

## Components

### Buttons
- **Primary Action (Direct Buy / Checkout)**:
  - Background: `#0D1321` (Obsidian Navy).
  - Text: `#F0EBD8` (Ecru Bone), Weight 600, 14px.
  - Border: 1px solid `#0D1321`.
  - Hover: Background transitions to `#1D2D44`. Active state depresses 1px downward.
  - Radius: 4px (`roundedness: 1`).
- **Secondary (Configure / Explore Spec)**:
  - Background: Transparent or `#F7F4EB`.
  - Text: `#0D1321`.
  - Border: 1px solid `rgba(29, 45, 68, 0.25)`.
  - Hover: Border color `#0D1321`, background `#E5DFC9`.

### Cards & Product Modules
- Flat surface `#F7F4EB` surrounded by a 1px `rgba(29, 45, 68, 0.1)` border.
- Integrated aspect-ratio image wells set over `#E5DFC9` background mats.
- Zero drop shadows by default. On hover, the 1px border shifts to `#3E5C76` accompanied by an immediate micro-zoom on photography without canvas jitter.

### Form Inputs & Search
- Background: `#E5DFC9` (Sunken bone).
- Border: 1px solid `rgba(29, 45, 68, 0.15)`.
- Text: `#0D1321`, placeholder in `#748CAB`.
- Focus State: Border expands to 1px solid `#1D2D44` with an inner halo outline in `#748CAB` (no glow, crisp inset line).

### Chips & Specification Tags
- Compact, flat rectangular tags with 2px corner radius.
- Background: `rgba(62, 92, 118, 0.08)`.
- Text: `#3E5C76`, 11px uppercase, letter-spacing `0.08em`.
- Border: 1px solid `rgba(62, 92, 118, 0.16)`.

### Selection Controls (Checkboxes & Radios)
- Checkboxes: 16px square, 2px radius, 1.5px border `#3E5C76`. Checked fill `#0D1321` with `#F0EBD8` mechanical check mark.
- Radio Swatches: Dual-ring anodized indicator. Active option shows an outer 1px ring in `#0D1321` with a 2px gap separating the internal solid fill.

### Sticky Conversion Rail (EDC Quick-Dock)
- Fixed bottom on mobile, sticky right rail on desktop product detail pages.
- Houses sku configuration, immediate inventory counter ("Batch 04 - 14 Units Left"), and direct frictionless checkout trigger without slider obstruction.