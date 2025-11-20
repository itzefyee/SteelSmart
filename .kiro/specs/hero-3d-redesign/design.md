# Design Document

## Overview

This design document outlines the implementation of a new hero section for the Metalyze homepage featuring an animated text prompt and interactive 3D model preview. The design follows a blue and white blueprint aesthetic inspired by technical engineering drawings, creating an immediate visual connection to the platform's CAD capabilities.

The hero section will replace the current hero component and become the primary focal point of the homepage, with existing sections (AI-Powered Tools, Featured Products, etc.) repositioned below it. The design emphasizes visual engagement through animation, interactivity, and a clean professional appearance suitable for both technical and business audiences.

## Architecture

### Component Hierarchy

```
HomePage (page.tsx)
├── Header
├── HeroBlueprint (NEW)
│   ├── AnimatedTextPrompt
│   ├── Model3DViewer
│   └── HeroCallToAction
├── AIToolsShowcase (MOVED DOWN)
├── FeaturedProducts (MOVED DOWN)
├── CategoryShowcase
└── Footer
```

### Technology Stack

- **3D Rendering**: Three.js with React Three Fiber (@react-three/fiber, @react-three/drei)
- **Animation**: Framer Motion for text animations and transitions
- **Styling**: Tailwind CSS with custom blueprint theme extensions
- **Model Format**: GLTF/GLB for optimized 3D model loading
- **TypeScript**: Full type safety across all components

### File Structure

```
src/
├── components/
│   ├── hero/
│   │   ├── HeroBlueprint.tsx          (Main hero container)
│   │   ├── AnimatedTextPrompt.tsx     (Typing animation component)
│   │   ├── Model3DViewer.tsx          (3D model renderer)
│   │   └── HeroCallToAction.tsx       (CTA button component)
│   └── layout/
│       └── Hero.tsx                    (DEPRECATED - to be replaced)
├── lib/
│   └── three-helpers.ts                (3D utilities and loaders)
└── public/
    └── models/
        └── sample-part.glb             (Sample 3D CAD model)
```

## Components and Interfaces

### 1. HeroBlueprint Component

**Purpose**: Main container component that orchestrates the hero section layout and manages the blueprint theme styling.

**Props Interface**:
```typescript
interface HeroBlueprintProps {
  className?: string;
}
```

**Key Features**:
- Implements blueprint-style background with subtle grid pattern
- Manages responsive layout (side-by-side on desktop, stacked on mobile)
- Applies blue and white color scheme
- Handles section spacing and padding

**Styling Approach**:
- Background: White to light gray gradient (#FFFFFF → #F9FAFB)
- Grid overlay: Light blue dots at 5% opacity
- Border accents: Cyan (#00D4FF) for technical drawing aesthetic
- Padding: Responsive (py-16 on mobile, py-24 on desktop)

### 2. AnimatedTextPrompt Component

**Purpose**: Displays animated text that demonstrates example CAD generation queries with typing effects.

**Props Interface**:
```typescript
interface AnimatedTextPromptProps {
  prompts: string[];
  typingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}
```

**Key Features**:
- Cycles through multiple example prompts
- Typing animation effect using Framer Motion
- Cursor blink animation
- Respects prefers-reduced-motion for accessibility
- Displays "Discover Text-to-CAD" heading

**Animation Behavior**:
1. Type out first prompt character by character (50ms per character)
2. Pause for 3 seconds
3. Delete prompt with backspace effect (30ms per character)
4. Pause for 500ms
5. Repeat with next prompt in array

**Example Prompts**:
```typescript
const defaultPrompts = [
  "A 200mm vented brake rotor with 6 mounting holes",
  "Steel mounting bracket 100x50mm with 4x M8 holes",
  "Aluminum heat sink 80x80x40mm with fin spacing 2mm"
];
```

**Accessibility**:
- Uses `aria-live="polite"` for screen reader announcements
- Disables animation when `prefers-reduced-motion: reduce` is detected
- Shows static text instead of animation for reduced motion users

### 3. Model3DViewer Component

**Purpose**: Renders an interactive 3D CAD model with automatic rotation and manual control capabilities.

**Props Interface**:
```typescript
interface Model3DViewerProps {
  modelPath: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
  wireframe?: boolean;
  specifications?: ModelSpecifications;
  className?: string;
}

interface ModelSpecifications {
  dimensions: string;
  material: string;
  holes?: string;
  weight?: string;
}
```

**Key Features**:
- Loads GLTF/GLB 3D models
- Automatic continuous rotation
- Mouse drag for manual rotation control
- Wireframe/blueprint rendering style
- Specification overlay display
- Responsive canvas sizing

**3D Scene Configuration**:
```typescript
const sceneConfig = {
  camera: {
    position: [2, 2, 5],
    fov: 50
  },
  lighting: {
    ambient: { intensity: 0.5, color: '#ffffff' },
    directional: { 
      intensity: 0.8, 
      position: [5, 5, 5],
      color: '#00D4FF'
    }
  },
  controls: {
    enableZoom: true,
    enablePan: false,
    autoRotate: true,
    autoRotateSpeed: 2
  }
};
```

**Material Styling**:
- Wireframe mode: Blue edges (#0066CC) with transparent faces
- Blueprint style: Cyan edges (#00D4FF) with light blue fill (rgba(0, 212, 255, 0.1))
- Edge thickness: 2px for visibility

**Specification Overlay**:
- Positioned at bottom-left of viewer
- Semi-transparent white background (rgba(255, 255, 255, 0.9))
- Blue text for values, gray for labels
- Displays: dimensions, material, holes, weight

### 4. HeroCallToAction Component

**Purpose**: Prominent button that directs users to the CAD generator.

**Props Interface**:
```typescript
interface HeroCallToActionProps {
  label?: string;
  href?: string;
  className?: string;
}
```

**Key Features**:
- Gradient blue button styling
- Hover effects with lift and glow
- Icon with arrow or sparkle
- Keyboard accessible
- Loading state support

**Styling**:
- Background: Linear gradient from #0066CC to #00D4FF
- Text: White, bold (font-weight: 600)
- Padding: 12px 32px
- Border radius: 12px
- Shadow: 0 4px 12px rgba(0, 102, 204, 0.25)
- Hover: translateY(-2px) + stronger shadow

## Data Models

### 3D Model Asset

```typescript
interface CADModel {
  id: string;
  name: string;
  filePath: string;
  format: 'glb' | 'gltf';
  fileSize: number;
  specifications: ModelSpecifications;
  thumbnail?: string;
}
```

### Animation Configuration

```typescript
interface AnimationConfig {
  enabled: boolean;
  typingSpeed: number;
  pauseDuration: number;
  deleteSpeed: number;
  respectReducedMotion: boolean;
}
```

### Theme Configuration

```typescript
interface BlueprintTheme {
  colors: {
    primary: string;      // #0066CC
    accent: string;       // #00D4FF
    secondary: string;    // #6B46C1
    background: string;   // #FFFFFF
    surface: string;      // #F9FAFB
    text: string;         // #111827
    textSecondary: string; // #6B7280
    border: string;       // #E5E7EB
  };
  grid: {
    enabled: boolean;
    color: string;
    opacity: number;
    size: number;
  };
}
```

## Error Handling

### 3D Model Loading Errors

**Scenario**: Model file fails to load or is corrupted

**Handling**:
1. Display fallback wireframe cube with blueprint styling
2. Show error message: "Unable to load 3D preview"
3. Log error to console for debugging
4. Provide retry button
5. Track error in analytics

```typescript
const handleModelError = (error: Error) => {
  console.error('3D Model loading failed:', error);
  setModelState({
    loaded: false,
    error: error.message,
    fallback: true
  });
  // Show fallback geometry
  setFallbackGeometry(<WireframeCube />);
};
```

### Animation Performance Issues

**Scenario**: Device has low performance or reduced motion preference

**Handling**:
1. Detect `prefers-reduced-motion` media query
2. Disable typing animation, show static text
3. Reduce 3D model complexity (lower poly count)
4. Disable auto-rotation on low-end devices
5. Use CSS transforms instead of JavaScript animation where possible

```typescript
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return prefersReducedMotion;
};
```

### Responsive Layout Issues

**Scenario**: Content doesn't fit properly on small screens

**Handling**:
1. Implement mobile-first responsive design
2. Stack components vertically on screens < 768px
3. Reduce 3D viewer height on mobile (50vh instead of 70vh)
4. Scale text sizes proportionally
5. Hide specification overlay on very small screens (< 375px)

## Testing Strategy

### Unit Tests

**AnimatedTextPrompt Component**:
- Test prompt cycling logic
- Verify typing speed calculations
- Test reduced motion fallback
- Verify accessibility attributes (aria-live)
- Test pause and delete timing

**Model3DViewer Component**:
- Test model loading success
- Test model loading failure and fallback
- Verify auto-rotation functionality
- Test manual rotation controls
- Verify specification overlay rendering

**HeroCallToAction Component**:
- Test button click navigation
- Verify keyboard accessibility
- Test hover states
- Verify focus states

### Integration Tests

**HeroBlueprint Component**:
- Test responsive layout switching (desktop/mobile)
- Verify all child components render correctly
- Test theme application across components
- Verify section positioning on homepage

**Homepage Layout**:
- Test hero section appears first
- Verify existing sections moved down correctly
- Test scroll behavior and navigation
- Verify no layout shifts during load

### Visual Regression Tests

- Capture screenshots at multiple breakpoints (320px, 768px, 1024px, 1920px)
- Compare blueprint theme colors against design specs
- Verify grid pattern rendering
- Test 3D model appearance in wireframe mode
- Verify button gradients and shadows

### Performance Tests

- Measure 3D model load time (target: < 2 seconds)
- Test frame rate during auto-rotation (target: 60fps)
- Measure First Contentful Paint (target: < 1.5s)
- Test animation performance on low-end devices
- Verify bundle size impact (target: < 100KB additional)

### Accessibility Tests

- Run axe-core automated accessibility checks
- Test keyboard navigation through all interactive elements
- Verify screen reader announcements for animated text
- Test with reduced motion preferences enabled
- Verify color contrast ratios (minimum 4.5:1)
- Test with browser zoom at 200%

### Browser Compatibility Tests

**Target Browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Test Cases**:
- 3D rendering with WebGL support
- CSS Grid layout compatibility
- Framer Motion animations
- Gradient rendering
- Backdrop filter support (with fallback)

### User Acceptance Testing

**Test Scenarios**:
1. First-time visitor lands on homepage
   - Verify hero section captures attention
   - Confirm value proposition is clear
   - Test CTA button is prominent and clickable

2. Mobile user browses on phone
   - Verify layout stacks properly
   - Test 3D viewer is usable on touch screen
   - Confirm text is readable without zooming

3. User with accessibility needs
   - Test with screen reader (NVDA/JAWS)
   - Verify keyboard-only navigation
   - Test with high contrast mode

4. User on slow connection
   - Verify loading states display properly
   - Test fallback content appears quickly
   - Confirm page remains usable during model load

## Implementation Notes

### Tailwind Configuration Updates

Add blueprint theme colors to `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#0066CC',
        'primary-light': '#3399FF',
        secondary: '#6B46C1',
        accent: '#00D4FF',
        'accent-light': '#66E0FF',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#111827',
        'text-secondary': '#6B7280',
        border: '#E5E7EB',
      },
      backgroundImage: {
        'blueprint-grid': 'radial-gradient(circle, rgba(0, 102, 204, 0.05) 1px, transparent 1px)',
        'gradient-blue': 'linear-gradient(135deg, #0066CC, #00D4FF)',
        'gradient-purple': 'linear-gradient(135deg, #6B46C1, #9B7FD9)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'blue-glow': '0 4px 12px rgba(0, 102, 204, 0.25)',
        'blue-glow-lg': '0 12px 24px rgba(0, 102, 204, 0.3)',
      },
    },
  },
};
```

### Dependencies to Install

```json
{
  "dependencies": {
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.88.0",
    "three": "^0.158.0",
    "framer-motion": "^10.16.0"
  },
  "devDependencies": {
    "@types/three": "^0.158.0"
  }
}
```

### Sample 3D Model

For the initial implementation, use a simple brake rotor or mounting bracket model:
- Format: GLB (optimized)
- Poly count: < 10,000 triangles
- File size: < 500KB
- Includes: Geometry only (no textures needed for wireframe)

### Performance Optimization

1. **Lazy Loading**: Load 3D model after hero section is in viewport
2. **Code Splitting**: Dynamic import for Three.js components
3. **Model Optimization**: Use Draco compression for GLB files
4. **Animation Throttling**: Use requestAnimationFrame for smooth 60fps
5. **Memoization**: Memoize 3D scene components to prevent unnecessary re-renders

### Accessibility Considerations

1. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
2. **Focus Management**: Visible focus indicators on all focusable elements
3. **Screen Readers**: Proper ARIA labels and live regions for dynamic content
4. **Motion Sensitivity**: Respect prefers-reduced-motion preference
5. **Color Contrast**: Maintain WCAG AA standards (4.5:1 minimum)
6. **Semantic HTML**: Use proper heading hierarchy and landmark regions

## Design Decisions and Rationales

### Why Three.js with React Three Fiber?

**Decision**: Use React Three Fiber instead of vanilla Three.js or other 3D libraries

**Rationale**:
- Declarative React-style API matches existing codebase patterns
- Better integration with React component lifecycle
- Excellent performance with automatic optimization
- Strong community support and documentation
- Easier to maintain and test compared to imperative Three.js code

### Why Framer Motion for Text Animation?

**Decision**: Use Framer Motion instead of CSS animations or other libraries

**Rationale**:
- Provides fine-grained control over typing animation timing
- Built-in support for accessibility (respects prefers-reduced-motion)
- Declarative API consistent with React patterns
- Excellent performance with hardware acceleration
- Easy to create complex animation sequences

### Why Blueprint Theme Instead of Dark Theme?

**Decision**: Use blue and white blueprint theme instead of the existing dark blue gradient

**Rationale**:
- Better contrast for 3D model visibility (dark models on light background)
- Professional appearance suitable for B2B audience
- Aligns with technical engineering aesthetic
- Better accessibility with higher contrast ratios
- Unique visual identity that differentiates from competitors

### Why Auto-Rotate the 3D Model?

**Decision**: Enable automatic rotation by default with manual control on hover

**Rationale**:
- Demonstrates 3D nature of models immediately
- Engages users without requiring interaction
- Shows multiple angles of the part automatically
- Common pattern in 3D product viewers (familiar UX)
- Can be disabled for users with motion sensitivity

### Why Move Existing Sections Down?

**Decision**: Reposition existing hero content below new hero section instead of replacing it

**Rationale**:
- Preserves existing functionality and user flows
- Allows gradual migration and A/B testing
- Maintains SEO value of existing content
- Reduces risk of breaking changes
- Provides fallback if new hero has issues

## Future Enhancements

1. **Multiple Model Variants**: Allow users to switch between different sample models
2. **AR Preview**: Add "View in AR" button for mobile devices
3. **Model Customization**: Interactive controls to change dimensions or materials
4. **Animation Presets**: Different rotation patterns (orbit, tumble, showcase)
5. **Performance Metrics**: Display model complexity stats (poly count, file size)
6. **Social Sharing**: Generate shareable links with specific model views
7. **Exploded View**: Animate model to show internal components
8. **Measurement Tools**: Allow users to measure distances on the 3D model
