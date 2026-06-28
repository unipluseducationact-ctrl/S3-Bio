---
name: BioFlow Design System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#414753'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#727784'
  outline-variant: '#c1c6d5'
  surface-tint: '#005cba'
  primary: '#004e9f'
  on-primary: '#ffffff'
  primary-container: '#0066cc'
  on-primary-container: '#dfe8ff'
  inverse-primary: '#aac7ff'
  secondary: '#006d37'
  on-secondary: '#ffffff'
  secondary-container: '#6bfe9c'
  on-secondary-container: '#00743a'
  tertiary: '#a50018'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9242c'
  on-tertiary-container: '#ffe2df'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e3ff'
  primary-fixed-dim: '#aac7ff'
  on-primary-fixed: '#001b3e'
  on-primary-fixed-variant: '#00458e'
  secondary-fixed: '#6bfe9c'
  secondary-fixed-dim: '#4ae183'
  on-secondary-fixed: '#00210c'
  on-secondary-fixed-variant: '#005228'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ae'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930014'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
  label-bold:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max: 1200px
---

## Brand & Style

The brand identity centers on clarity, vitality, and academic excellence. It is designed specifically for HKDSE Biology students, bridging the gap between rigorous scientific study and modern digital interaction. The personality is **Professional, Systematic, and Energetic**.

The design style follows a **Modern Corporate** aesthetic with a **Tactile** twist. We use clean, structured layouts to manage complex biological data, while incorporating soft depth and organic curves to mirror the fluid nature of life sciences. Whitespace is used strategically to reduce cognitive load during intense study sessions. The visual narrative draws from the "Uni+" reference, utilizing pill-shaped navigations and soft, layered containers to create a friendly yet focused environment.

## Colors

The palette is inspired by the aqueous and cellular environments of biology.

*   **Primary (Hydration Blue):** A deep, trustworthy blue used for navigation, primary actions, and core headings. It represents the "Uni+" foundation.
*   **Secondary (Chlorophyll Green):** A vibrant green used for success states, interactive biology tools, and emphasizing "correct" biological processes.
*   **Tertiary (Vitality Red):** Extracted from the "Uni+" logo, used sparingly for critical warnings, damaged states (like cell membrane damage), and high-importance alerts.
*   **Neutral (Cellular Grey):** A range of cool greys and off-whites that form the backdrop of the platform, ensuring content readability and a "paper-like" feel for study notes.
*   **Backgrounds:** Use subtle gradients (White to #F0F4F8) to create the soft, luminous depth seen in the reference top bar.

## Typography

The typography system is optimized for long-form study and bilingual technical terms.

*   **Headlines (Manrope):** A modern, geometric sans-serif that provides a clean, authoritative structure to chapter titles and section headers.
*   **Body (Work Sans):** Chosen for its exceptional legibility at small sizes and its friendly, neutral character. It handles technical English and Chinese characters (if applicable) with balanced spacing.
*   **Labels & Metadata (JetBrains Mono):** Used for scientific notations, formulas, and "metadata" such as exam year references or energy requirement tags (ATP).

**Style Note:** Important biological terms should be highlighted using a semi-transparent background tint of the Secondary or Primary color rather than just bolding.

## Layout & Spacing

This design system utilizes a **Fluid Grid** with a fixed maximum container width for desktop readability.

*   **Grid:** A 12-column grid for desktop and tablet; a 4-column grid for mobile.
*   **Rhythm:** Based on an 8px baseline to ensure vertical harmony between text rows and interactive components.
*   **Note Layout:** Study notes should occupy a centered 8-column span on desktop to maintain an optimal line length (60-75 characters).
*   **Sidebars:** Interactive tools and navigation utilize a "float" style where the sidebar card has clear margins from the viewport edge.

## Elevation & Depth

We use **Tonal Layers** combined with **Ambient Shadows** to create a sense of organized information.

*   **Surface Level 0 (Base):** Light grey-blue neutral (#F8FAFC).
*   **Surface Level 1 (Content Cards):** Pure white with a very soft, diffused shadow (0px 4px 20px rgba(0,0,0,0.05)).
*   **Surface Level 2 (Active/Modals):** Pure white with a more defined shadow and a 1px soft blue border.
*   **Glassmorphism:** Navigation bars and sticky headers use a backdrop blur (20px) and 80% opacity to maintain context of the content scrolling beneath them, as seen in the "Uni+" reference.

## Shapes

The shape language is defined by organic, approachable curves.

*   **Standard Corners:** 0.5rem (8px) for cards and input fields.
*   **Interactive Pill:** Buttons, tabs, and tags use a fully rounded "pill" shape (999px) to mirror the navigation style of the reference image.
*   **Encapsulation:** Biological diagrams should be placed within rounded containers to separate them from the text flow.

## Components

### Buttons & Navigation
*   **Primary Action:** Pill-shaped, Primary Blue background, white text.
*   **Tab System:** As seen in the reference, active tabs should be white pills with a soft shadow, while inactive tabs are transparent with dark-grey text.

### Interactive Notes
*   **Emphasis Boxes:** For "Exam Tips" or "Common Pitfalls," use cards with a thick left-accent border (4px) in the Primary or Tertiary color.
*   **Bilingual Toggle:** A small pill switch to alternate between English and Traditional Chinese terms.

### Data & Diagrams
*   **Tables:** Minimalist styling. No vertical borders; only subtle horizontal dividers. The header row should have a light Primary Blue tint (#E6F0F9).
*   **Checkboxes/Radios:** Circular (pill-influenced) even for checkboxes to maintain the organic biological theme.

### Cards
*   **Study Modules:** White background, 16px padding, 8px corner radius. On hover, the shadow deepens and the card lifts slightly (2px translation).