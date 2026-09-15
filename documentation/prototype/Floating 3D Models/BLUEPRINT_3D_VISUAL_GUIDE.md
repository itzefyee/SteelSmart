# Blueprint 3D Visual Guide

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAD Drawing Generator                         │
│                                                                   │
│  ╔═══╗                                              ╔═══╗        │
│  ║ G ║  (Gear - Floating)                          ║ B ║        │
│  ╚═══╝                                              ╚═══╝        │
│         (Bracket - Floating)                                     │
│                                                                   │
│                    ┌─────────────────┐                           │
│                    │                 │                           │
│                    │  CAD Generator  │              ╔═══╗        │
│                    │    Content      │              ║ G ║        │
│                    │                 │              ╚═══╝        │
│                    └─────────────────┘                           │
│                                                                   │
│  ╔═══╗                                              ╔═══╗        │
│  ║ B ║  (Beam - Floating)                          ║ S ║        │
│  ╚═══╝                                              ╚═══╝        │
│         (Shaft - Floating)                                       │
└─────────────────────────────────────────────────────────────────┘

Legend:
G = Gear (wireframe, rotating)
B = Bracket (wireframe, rotating)
B = Beam (wireframe, rotating)
S = Shaft (wireframe, rotating)
```

## Background Layers (Back to Front)

1. **Base Gradient** (z-index: 0)
   - Deep blue gradient background
   - Radial overlays for depth

2. **Grid Pattern** (z-index: 0, opacity: 0.18)
   - 40px major grid lines
   - 10px minor grid lines
   - Light blue color

3. **Wire Pattern** (z-index: 0, opacity: 0.14)
   - 60° diagonal lines
   - Blueprint technical drawing style

4. **Particle Layer** (z-index: 0, opacity: 0.22)
   - Animated radial gradients
   - Drifting effect (40s cycle)

5. **3D Models** (z-index: 1, opacity: 0.25-0.30)
   - Wireframe 3D components
   - Floating animations
   - Pulsing opacity

6. **Content** (z-index: 10)
   - CAD Generator interface
   - Glass morphism cards
   - Interactive elements

## Color Palette

### Background
```
#0f172a → #1e3a8a → #2563eb → #1d4ed8
(Slate-900 → Blue-900 → Blue-600 → Blue-700)
```

### Wireframe Models
```
#3b82f6 (Blue-500)
#60a5fa (Blue-400)
#2563eb (Blue-600)
#1d4ed8 (Blue-700)
```

### Grid/Wire Patterns
```
rgba(191, 219, 254, 0.12) - Major grid
rgba(96, 165, 250, 0.05)  - Minor grid
rgba(59, 130, 246, 0.08)  - Wire lines
```

### Text
```
#ffffff (White) - Headings
#e2e8f0 (Slate-200) - Body text
```

## Animation Timing

### Float Animations
- Gear (Top Left): 8s cycle, -15px movement
- Bracket (Top Right): 10s cycle, -20px movement
- Beam (Bottom Left): 12s cycle, -15px movement
- Shaft (Bottom Right): 9s cycle, -20px movement
- Gear (Center Right): 11s cycle, -15px movement

### Pulse Animations
- Opacity: 0.25 → 0.35 → 0.25
- Timing: 6-9s cycles
- Staggered delays: 0s, 1s, 1.5s, 2s, 3s

### Background Drift
- Particle layer: 40s cycle
- Alternating direction
- Subtle position shifts

## 3D Model Details

### Gear
- Geometry: Cylinder (radius: 1, height: 0.3, segments: 16)
- Rotation: Z-axis, 0.005 rad/frame
- Color: #3b82f6
- Opacity: 0.8

### Bracket
- Geometry: Extruded L-shape
- Rotation: Y-axis, 0.008 rad/frame
- Color: #60a5fa
- Opacity: 0.7

### Beam (I-Beam)
- Geometry: 3 boxes (2 flanges + 1 web)
- Rotation: X and Y axes
- Color: #2563eb
- Opacity: 0.75

### Shaft
- Geometry: Cylinder (radius: 0.3, length: 2.5, segments: 16)
- Rotation: X-axis, 0.01 rad/frame
- Color: #1d4ed8
- Opacity: 0.8

## Responsive Behavior

### Desktop (>1024px)
- All 5 models visible
- Full size (160-220px)
- Optimal spacing

### Tablet (768-1024px)
- All models visible
- Slightly reduced opacity
- Adjusted positioning

### Mobile (<768px)
- Consider hiding some models
- Reduce sizes
- Simplify animations

## Performance Notes

- Models use low-poly geometry (16 segments max)
- Wireframe rendering is GPU-efficient
- Dynamic import prevents SSR overhead
- Pointer-events: none prevents interaction lag
- RequestAnimationFrame for smooth 60fps

## Accessibility

- All decorative elements marked aria-hidden
- No impact on keyboard navigation
- Screen readers ignore background elements
- Content remains fully accessible
- High contrast maintained for text

## Browser Support

### Full Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Partial Support
- Older browsers: Background patterns only
- No WebGL: Models won't render
- Reduced motion: Animations disabled

## Comparison with Catalog

| Feature | Catalog | CAD Generator |
|---------|---------|---------------|
| Grid Opacity | 0.28 | 0.18 (-35%) |
| Wire Opacity | 0.20 | 0.14 (-30%) |
| Particle Opacity | 0.35 | 0.22 (-37%) |
| 3D Models | None | 5 wireframe models |
| Animation | Drift only | Float + Pulse + Drift |
| Color Scheme | Same blue gradient | Same blue gradient |
| Z-layering | 3 layers | 6 layers |

## Implementation Files

1. `src/components/cad/BlueprintModel3D.tsx` - 3D component
2. `src/app/cad-generator/page.tsx` - Page layout
3. `src/app/globals.css` - Styles and animations
4. `CAD_BLUEPRINT_3D_IMPLEMENTATION.md` - Technical docs
5. `BLUEPRINT_3D_VISUAL_GUIDE.md` - This file
