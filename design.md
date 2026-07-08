---
name: Cyber-Protocol
colors:
  surface: '#111417'
  surface-dim: '#111417'
  surface-bright: '#37393d'
  surface-container-lowest: '#0b0e11'
  surface-container-low: '#191c1f'
  surface-container: '#1d2023'
  surface-container-high: '#272a2e'
  surface-container-highest: '#323538'
  on-surface: '#e1e2e7'
  on-surface-variant: '#c4c9ac'
  inverse-surface: '#e1e2e7'
  inverse-on-surface: '#2e3134'
  outline: '#8e9379'
  outline-variant: '#444933'
  surface-tint: '#abd600'
  primary: '#ffffff'
  on-primary: '#283500'
  primary-container: '#c3f400'
  on-primary-container: '#556d00'
  inverse-primary: '#506600'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#ffffff'
  on-tertiary: '#2c3137'
  tertiary-container: '#dee3eb'
  on-tertiary-container: '#60656c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c3f400'
  primary-fixed-dim: '#abd600'
  on-primary-fixed: '#161e00'
  on-primary-fixed-variant: '#3c4d00'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#dee3eb'
  tertiary-fixed-dim: '#c2c7cf'
  on-tertiary-fixed: '#171c22'
  on-tertiary-fixed-variant: '#42474e'
  background: '#111417'
  on-background: '#e1e2e7'
  surface-variant: '#323538'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
  max-width: 1440px
---

## Brand & Style
The design system is a high-performance, technical interface designed for the next generation of decentralized finance and on-chain exploration. It targets a developer-centric and power-user audience who value precision, speed, and transparency.

The visual style is a fusion of **Corporate Minimalism** and **Cyber-Functionalism**. It utilizes a "Void" aesthetic—using absolute blacks to create depth, punctuated by high-frequency lime accents. Key motifs include monospace-inspired grid overlays, ASCII-patterned textures that hint at underlying code, and sharp, geometric containers that evoke a sense of architectural stability within the digital landscape.

## Colors
The palette is hyper-restricted to maximize visual impact and focus.

- **Primary (Lime #CCFF00):** Reserved exclusively for "Boost" actions, primary CTAs, and critical success states. It represents the "active" layer of the protocol.
- **Secondary (White #FFFFFF):** Used for primary typography and high-contrast iconography to ensure legibility against the dark background.
- **Surface Tiers:** 
  - `Void (#000000)`: The base layer for the largest surface areas.
  - `Surface-Deep (#0B0E11)`: Used for structural containers and navigation bars.
  - `Surface-Muted (#1E2329)`: Used for card backgrounds and input fields.
- **Functional Grays:** A scale of cool grays (#474D57 to #848E9C) is used for secondary data and metadata.

## Typography
The system uses **Inter** for all functional and editorial text to ensure maximum clarity across device densities. To lean into the "data-driven" aesthetic, **JetBrains Mono** is introduced for labels, transaction hashes, and numerical data.

Headlines should utilize tight letter-spacing and heavy weights to appear monolithic and authoritative. All body text maintains a generous line height to prevent the UI from feeling cramped despite the high-density data typical of wallet interfaces.

## Layout & Spacing
The layout follows a strict **12-column grid** on desktop and a **4-column grid** on mobile. The system uses an 8px base rhythm, with a 4px sub-grid for tight component internal spacing.

- **Grid Textures:** Use a subtle 32x32px CSS repeating grid or dot-matrix pattern in the background of hero sections to reinforce the technical theme.
- **Sectioning:** Large vertical sections are separated by `1px` borders in `#1E2329` rather than large gaps of whitespace.
- **Margins:** Desktop margins are expansive (48px+) to allow the "Void" background to create a sense of scale, while content is contained within a 1440px max-width wrapper.

## Elevation & Depth
In this design system, depth is achieved through **Tonal Layering** and **Glassmorphism** rather than traditional drop shadows.

- **Stacking:** Elements closer to the user are lighter in tone (e.g., #1E2329 surfaces on a #000000 background).
- **Glassmorphism:** Overlays (modals, dropdowns) use a background blur (20px) with a semi-transparent fill (`rgba(255, 255, 255, 0.05)`) and a `1px` white border at 10% opacity.
- **Shadows:** If used, shadows must be extremely subtle, sharp, and black—acting more as a "cutout" effect than a soft glow.

## Shapes
The shape language is primarily geometric. While the system uses a **Rounded (0.5rem)** base for components like buttons and inputs to maintain modern ergonomics, larger containers and structural elements (sections, hero cards) often feature sharp 90-degree corners or technical accents like "L-shaped" corner brackets. 

Iconography should follow a linear, 2px stroke weight with slight corner rounding to match the typography.

## Components

- **Buttons:**
  - *Primary:* Lime green fill with black text. No border. High contrast.
  - *Secondary:* Pure white fill with black text, or transparent with 1px white border.
  - *Boost:* Features a specific "Rocket" icon prefix and a subtle outer glow (0 0 12px) in lime green.
- **Cards:**
  - Use a subtle #0B0E11 background with a 1px #1E2329 border. 
  - For featured cards, apply a faint ASCII texture or a grid pattern overlay at 5% opacity.
- **Input Fields:** 
  - Dark grey background (#1E2329) with no border in resting state. 
  - On focus, the border transitions to a 1px white stroke or 1px lime stroke if it's a critical action.
- **Chips/Status:** 
  - Status indicators use the monospace font. 
  - "On-chain" status uses a pulsing green dot next to the text.
- **Dividers:** 
  - Strictly 1px thin. Use `rgba(255, 255, 255, 0.1)` for horizontal rules between list items.