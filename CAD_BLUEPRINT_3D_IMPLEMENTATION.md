# CAD Blueprint 3D Models Implementation

## Overview
Added blueprint-style 3D wireframe models with floating animations and the same blueprint wireframe background from the product catalog to the CAD Drawing Generator page.

## What Was Created

### 1. BlueprintModel3D Component
**File:** `src/components/cad/BlueprintModel3D.tsx`

A React Three Fiber component that renders wireframe 3D models in blueprint style:
- **Gear**: Rotating cylindrical gear with wireframe rendering
- **Bracket**: L-shaped bracket with extruded geometry
- **Beam**: I-beam structure with flanges and web
- **Shaft**: Cylindrical shaft component

**Features:**
- Transparent wireframe rendering (opacity 0.7-0.8)
- Blue color scheme matching blueprint aesthetic (#3b82f6, #60a5fa, #2563eb, #1d4ed8)
- Floating animations using Three.js useFrame hook
- Auto-rotating camera with OrbitControls
- Multiple models per scene for visual interest

### 2. CAD Generator Page Updates
**File:** `src/app/cad-generator/page.tsx`

**Changes:**
- Converted to client component ('use client')
- Added blueprint background shell (`cad-generator-shell`)
- Integrated 5 floating 3D models at strategic positions
- Applied CSS animations for floating and pulsing effects
- Dynamic import of BlueprintModel3D to avoid SSR issues

**Model Placement:**
- Top Left (10%, 5%): Gear - 200x200px
- Top Right (15%, 8%): Bracket - 180x180px
- Bottom Left (20%, 10%): Beam - 220x220px
- Bottom Right (15%, 5%): Shaft - 190x190px
- Center Right (50%, 3%): Gear - 160x160px

### 3. CSS Styles
**File:** `src/app/globals.css`

**Added Styles:**

#### Background Shell
```css
.cad-generator-shell
```
- Blue gradient background matching catalog style
- Radial gradients for depth
- Screen blend mode overlay

#### Blueprint Patterns (Toned Down)
```css
.cad-grid-pattern
.cad-wire-pattern
.cad-particle-layer
```
- Grid pattern: 40px major grid, 10px minor grid (opacity 0.18)
- Wire pattern: 60° diagonal lines (opacity 0.14)
- Particle layer: Radial gradients with drift animation (opacity 0.22)

**Opacity Comparison:**
- Catalog patterns: 0.28, 0.20, 0.35
- CAD patterns: 0.18, 0.14, 0.22 (reduced by ~35-40%)

#### Animations
```css
@keyframes blueprintFloat
@keyframes blueprintFloatAlt
@keyframes blueprintPulse
```
- Float: Vertical movement (-15px to -20px) with subtle rotation
- Pulse: Opacity variation (0.25 to 0.35)
- Different timing for each model (8s to 12s)

## Visual Design

### Color Scheme
- Background: Deep blue gradient (#0f172a → #1e3a8a → #2563eb → #1d4ed8)
- Wireframes: Blue shades (#3b82f6, #60a5fa, #2563eb, #1d4ed8)
- Grid/Wire: Light blue with transparency (rgba(59, 130, 246, 0.08-0.12))
- Text: White and slate-200 for contrast

### Transparency Levels
- Background patterns: 14-22% opacity
- 3D models: 25-30% opacity
- Wireframe materials: 70-80% opacity
- Overall effect: Subtle, non-distracting background

## Technical Details

### Dependencies
- `@react-three/fiber`: React renderer for Three.js
- `@react-three/drei`: Helper components (OrbitControls, PerspectiveCamera)
- `three`: 3D graphics library

### Performance Optimizations
- Dynamic import with SSR disabled
- Pointer-events: none on floating models
- Reduced polygon count on geometries
- Efficient animation loops with useFrame

### Responsive Behavior
- Fixed pixel sizes for models (160px-220px)
- Percentage-based positioning
- Z-index layering (patterns: 0, models: 1, content: 10)

## Usage

The blueprint background and floating models are automatically displayed on the CAD Generator page at `/cad-generator`.

### Customization Options

**Change Model Types:**
```tsx
<BlueprintModel3D modelType="gear" | "bracket" | "beam" | "shaft" />
```

**Adjust Opacity:**
Modify the `opacity-30` class on model containers or change the CSS animations.

**Change Animation Speed:**
Modify the animation duration in the style prop:
```tsx
style={{ animation: 'blueprintFloat 8s ease-in-out infinite' }}
```

**Adjust Background Opacity:**
Edit the opacity values in `globals.css`:
```css
.cad-grid-pattern { opacity: 0.18; }
.cad-wire-pattern { opacity: 0.14; }
.cad-particle-layer { opacity: 0.22; }
```

## Browser Compatibility
- Modern browsers with WebGL support
- Graceful degradation: Models won't render on unsupported browsers
- Background patterns work on all browsers

## Accessibility
- Models marked with `aria-hidden="true"` on pattern layers
- Pointer-events disabled to prevent interaction issues
- No impact on keyboard navigation or screen readers

## Future Enhancements
- Add more model types (bolts, plates, tubes)
- Interactive hover effects on models
- Sync animations with user scroll position
- Add particle effects for enhanced depth
- Mobile-optimized model sizes and positions
