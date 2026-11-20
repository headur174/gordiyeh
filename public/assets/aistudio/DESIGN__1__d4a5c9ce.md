---
name: Pure Architectural Metallurgy
colors:
  surface: '#02142a'
  surface-dim: '#02142a'
  surface-bright: '#2a3a51'
  surface-container-lowest: '#000e23'
  surface-container-low: '#0b1c32'
  surface-container: '#0f2036'
  surface-container-high: '#1a2a41'
  surface-container-highest: '#26354d'
  on-surface: '#d5e3ff'
  on-surface-variant: '#cac6bb'
  inverse-surface: '#d5e3ff'
  inverse-on-surface: '#213148'
  outline: '#949187'
  outline-variant: '#49473f'
  surface-tint: '#cbc7b5'
  primary: '#ffffff'
  on-primary: '#323124'
  primary-container: '#e7e3d0'
  on-primary-container: '#676556'
  inverse-primary: '#615f50'
  secondary: '#abcae8'
  on-secondary: '#12334b'
  secondary-container: '#2b4963'
  on-secondary-container: '#9ab8d6'
  tertiary: '#ffffff'
  on-tertiary: '#18324c'
  tertiary-container: '#d1e4ff'
  on-tertiary-container: '#4e6683'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e7e3d0'
  primary-fixed-dim: '#cbc7b5'
  on-primary-fixed: '#1d1c10'
  on-primary-fixed-variant: '#494739'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#abcae8'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#2b4963'
  tertiary-fixed: '#d1e4ff'
  tertiary-fixed-dim: '#b0c8ea'
  on-tertiary-fixed: '#001d36'
  on-tertiary-fixed-variant: '#304864'
  background: '#02142a'
  on-background: '#d5e3ff'
  surface-variant: '#26354d'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 3.5rem
    fontWeight: '700'
    lineHeight: 4rem
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 2.5rem
    fontWeight: '600'
    lineHeight: 3rem
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 1.25rem
    fontWeight: '500'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: 0.04em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.06em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '400'
    lineHeight: 0.875rem
    letterSpacing: 0.08em
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 3rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies high-contrast architectural brutalism fused with understated industrial luxury. Drawing aesthetic cues from tectonic slate, oxidized petroleum metals, and bespoke chiseled stone, it creates an atmosphere of uncompromising permanence, precision, and structural authority.

The target audience consists of architectural technologists, structural engineers, precision instrument operators, and connoisseurs of technical luxury who demand dense, legible, and unyielding interfaces. The UI evokes clinical calm, stoic authority, and the heavy physical tactility of monolithic materials. Visual noise and decorative fluff are eliminated in favor of tectonic division, exacting typographic geometry, and purposeful metallurgic contrast.

## Colors

The palette is strictly calibrated around deep oceanic obsidian and cold industrial metals, anchored by an unyielding cream-ivory highlight:

- **Canvas & Abyssal Void (`#0D1321`):** The absolute foundational background. Deep, light-absorbing obsidian navy that grounds all structural viewports. Never substituted for pure black or light tones.
- **Container Petrol (`#1D2D44`):** The baseline monolithic surface for cards, panels, headers, and floating toolbars. Provides distinct tonal separation from the background void without introducing harshness.
- **Steel Petrol (`#3E5C76`):** The functional secondary accent. Deployed for tectonic bounding borders, inactive interactive strokes, hair-line divider grids, and mechanical framing elements.
- **Muted Technical Slate (`#748CAB`):** The informational tertiary tier. Dedicated to metadata, tabular indices, system telemetry, units of measurement, and unselected status labels.
- **Cream Ivory Accent (`#F0EBD8`):** The primary illumination token. Used for high-contrast primary typography, focused states, vital system indicators, and singular focal moments. It replaces stark fluorescent whites and aggressive yellows with a refined, chiseled warmth.

## Typography

The typographic hierarchy implements an engineered triumvirate:
- **Headlines (Space Grotesk):** Engineered, structural geometry with brutalist presence. Negative tracking is required to enforce compact, sculptural headlines that command dark viewports.
- **Body Text (Geist):** Hyper-focused, neutral sans-serif designed for high-density reading under low ambient illumination. Maintains impeccable optical balance when set in `#F0EBD8` on `#0D1321` or `#1D2D44`.
- **System & Metric Data (JetBrains Mono):** Mechanical monospace reserved for telemetry, computational indexes, coordinate readouts, micro-labels, and interaction metadata. Always typeset with intentional positive letter-spacing and uppercase styling when used for categorical tags.

## Layout & Spacing

The layout is constructed on an unapologetic architectural grid. Content is anchored to a 12-column fluid grid on desktop viewports (collapsing to 8 columns on tablet, and 4 columns on mobile screens).

Layout boundaries rely on stark structural grid lines rather than floating margins. Sections snap flush against one another using precise dividers rendered in `#3E5C76`. Spacing rhythm follows a mathematical 4px/8px modular base scale. Whitespace is deliberate and controlled: large macro voids highlight central monolithic panels, while micro layouts maintain dense, functional data compactness.

## Elevation & Depth

This system intentionally rejects soft, ambient drop shadows and skeuomorphic blur gradients. Depth is realized solely through **Tonal Tiering** and **Tectonic Outlines**:

- **Ground Level (Zero Elevation):** Base canvas in `#0D1321`.
- **Structural Tier 1 (Containers & Panels):** Solid fill of `#1D2D44` enclosed by a 1px solid stroke of `#3E5C76`.
- **Structural Tier 2 (Flyouts, Menus & Overlays):** Layered `#1D2D44` with an accented 1px border of `#748CAB`, paired with a dense, zero-blur directional offset: `4px 4px 0px rgba(13, 19, 33, 0.9)`.
- **Active Structural State (Focus & Active Panels):** The 1px perimeter border transitions directly to primary `#F0EBD8`, creating an unmistakable, crisp architectural halo without volumetric diffuse glow.

## Shapes

The shape architecture is uncompromisingly **Sharp (`0`)**. Every component, module, button, input, and modal features strict 90-degree right angles (`border-radius: 0px`).

Rounding weakens the architectural weight of the dark metallurgy motif. Visual cohesion is maintained through raw structural silhouettes, bevel-free intersections, and clean geometric planes.

## Components

### Buttons
- **Primary:** Background `#F0EBD8`, text `#0D1321` (bold Space Grotesk or JetBrains Mono uppercase), zero border radius. On hover: background shifts to `#748CAB` with text in `#0D1321`. Active state snaps with a 1px inset border of `#3E5C76`.
- **Secondary / Outline:** Transparent fill, 1px solid border in `#3E5C76`, text `#F0EBD8`. On hover: border promotes to `#F0EBD8`, background shifts to `#1D2D44`.
- **Tertiary / Ghost:** Transparent fill, no border, text `#748CAB`. On hover: text illuminates to `#F0EBD8`.

### Input Fields
- Monolithic surface in `#1D2D44`, 1px boundary stroke in `#3E5C76`. Text is set in `#F0EBD8` using `Geist`. Placeholder text is locked to `#748CAB`.
- Focused state: 1px continuous stroke of `#F0EBD8`. No fuzzy focus rings; focus is indicated strictly by the crisp metallic stroke transition.

### Chips & Badges
- Compact rectangular badges with sharp corners. Bordered in 1px `#3E5C76`, filled with `#0D1321`. Typography in `label-sm` JetBrains Mono colored `#748CAB`. Active or selected chips shift fill to `#1D2D44` and text to `#F0EBD8`.

### Lists & Data Grids
- Tabular architectural layouts separated by 1px horizontal and vertical border lines in `#3E5C76`.
- Header rows utilize `#0D1321` background with `#748CAB` uppercase monospace labels. Data cells use alternating subtle rows (`#1D2D44` and `#0D1321`) with `#F0EBD8` primary text.

### Checkboxes & Radio Buttons
- **Checkboxes:** Sharp 14x14px square. 1px solid `#3E5C76` outline on `#0D1321`. When checked: solid `#F0EBD8` background with an inverted `#0D1321` geometric mark.
- **Radio Buttons:** Square outer shell (14x14px) with a centered solid 6x6px square pip in `#F0EBD8` when active. Circular geometry is prohibited.

### Cards & Modular Panels
- Fabricated with solid `#1D2D44` surface fill, delimited by a 1px `#3E5C76` frame. Card headers feature an integrated technical rubric separated by a 1px horizontal rule, displaying index numbers and labels in `#748CAB`.

### Architectural HUD Status Indicators (Domain Specific)
- Live instrumentation nodes composed of 6x6px square indicators. Operational states toggle between `#748CAB` (standby) and `#F0EBD8` (active engagement), accompanied by monospace telemetry timestamps.