# Lovable Prompt: Metalyze Dark Theme UI Prototype

## Project Overview
Create a cutting-edge, futuristic web application for **Metalyze** - an AI-powered 3D CAD analysis platform. The design should emphasize dark mode aesthetics, holographic effects, metallic elements, and 3D modeling capabilities with a tech-forward, hackathon-ready visual style.

---

## Brand Identity

### Logo
- **Primary Logo**: Wireframe 3D cube with metallic-to-holographic gradient
- **Style**: Geometric wireframe structure representing 3D models
- **Colors**: Metallic Silver (#C0C0C0) → Electric Cyan (#00D4FF) → Deep Purple (#6B46C1)
- **Tagline**: "AI-Powered CAD Analysis"
- **Character**: Modern, tech-forward, precision engineering

### Typography
- **Font Family**: Inter (sans-serif) for all text
- **Headings**: Font weight 700, letter-spacing -0.02em, gradient text effect (cyan to white)
- **Body Text**: Font weight 400, color #E5E7EB, line-height 1.6
- **Code/Technical**: JetBrains Mono or Fira Code, color #00D4FF

---

## Color Palette

### Primary Colors
```
Electric Cyan: #00D4FF (main brand color)
Deep Cyan: #0099CC
Light Cyan: #66E5FF
Deep Purple: #6B46C1 (tech accent)
Dark Purple: #553399
Light Purple: #9B7FD9
Pink Accent: #FF6B9D (CTAs and highlights)
Metallic Silver: #C0C0C0 (3D elements)
```

### Dark Theme Neutrals
```
Almost Black: #0F1419 (main background)
Dark Surface: #1A1F26 (card backgrounds)
Elevated Surface: #252B35 (elevated elements)
Gray 900: #1F2937
Gray 800: #374151
Gray 700: #4B5563
Gray 600: #6B7280
Gray 500: #9CA3AF
Gray 400: #D1D5DB
Gray 300: #E5E7EB (body text)
Gray 200: #F3F4F6
Gray 100: #F9FAFB
```

### Gradients
```
Primary Gradient: linear-gradient(135deg, #00D4FF 0%, #6B46C1 100%)
Metallic Gradient: linear-gradient(135deg, #C0C0C0 0%, #E8E8E8 50%, #A0A0A0 100%)
Holographic Gradient: linear-gradient(135deg, #00D4FF 0%, #6B46C1 50%, #FF6B9D 100%)
Dark Gradient: linear-gradient(180deg, #0F1419 0%, #1A1F26 100%)
Glow Gradient: radial-gradient(circle, rgba(0,212,255,0.2) 0%, transparent 70%)
```

### 3D Model Visualization Colors
```
Wireframe Edges: #00D4FF (electric cyan)
Model Faces: rgba(107,70,193,0.3) (semi-transparent purple)
Vertex Points: #FF6B9D (pink)
Background Grid: rgba(192,192,192,0.1) (subtle silver)
Model Shadows: rgba(0,0,0,0.5)
```

---

## Layout Structure

### Homepage Layout

**Header/Navigation**
- Logo on left (wireframe cube + "METALYZE" text with gradient)
- Navigation links: CAD Generator, Analyzer, Catalog
- Login button on right (holographic gradient)
- Dark background (#1A1F26) with subtle cyan border bottom
- Backdrop blur effect
- Sticky on scroll with glow shadow

**Hero Section**
- Dark gradient background (#0F1419 → #1A1F26)
- Radial gradient overlays (cyan and purple at 5% opacity)
- Animated 3D wireframe cube (large, rotating)
- Heading: "METALYZE" with cyan-to-white gradient text
- Subheading: "AI-Powered 3D CAD Analysis"
- Description: "Transform technical drawings into intelligent 3D models"
- Two CTAs:
  - Primary: "Start Analyzing →" (holographic gradient with shine effect)
  - Secondary: "View Demo" (outlined cyan with glow on hover)
- Stats row: "500+ Models • 98% Accuracy • 24h Quotes" (cyan accent color)

**Feature Cards Section**
- Three cards in a row (responsive grid)
- Each card (glassmorphism style):
  - Background: rgba(26, 31, 38, 0.8)
  - Backdrop filter: blur(20px)
  - Border: 1px solid rgba(0, 212, 255, 0.1)
  - Border radius: 16px
  - Padding: 24px
  - Box shadow: 0 4px 24px rgba(0, 0, 0, 0.4)
  - Inset highlight: 0 1px 0 rgba(255, 255, 255, 0.05)
  - Icon container: 56x56px with holographic gradient
  - Hover effect: lift up, cyan glow shadow, stronger border

**Card 1: CAD Generator**
- Icon: Geometric shapes (cyan gradient)
- Title: "CAD Generator"
- Description: "Generate 3D models from text descriptions"

**Card 2: 3D Viewer**
- Icon: Rotation symbols (purple gradient)
- Title: "3D Viewer Preview"
- Description: "Interactive model rotation and inspection"

**Card 3: AI Match Engine**
- Icon: Directional arrows (pink gradient)
- Title: "AI Match Engine"
- Description: "Smart product matching and recommendations"

---

## Key Pages/Components

### 1. CAD Generator Interface

**Layout**: Two-column split (40% input / 60% preview)

**Left Panel - Input**
- Dark glassmorphism card
- Background: rgba(26, 31, 38, 0.95)
- Backdrop blur
- AI icon with "Metalyze AI" heading (gradient text)
- Large textarea:
  - Placeholder: "Describe your component..."
  - Background: rgba(255, 255, 255, 0.05)
  - Border: 1px solid rgba(0, 212, 255, 0.2)
  - Focus: Cyan border with glow shadow
  - Text color: #E5E7EB
- Format selection (radio buttons):
  - STEP, STL, OBJ, DXF
  - Cyan when selected with glow
- Primary button: "Generate 3D Model →" (holographic gradient with shine animation)

**Right Panel - Preview**
- Dark background with grid pattern
- 3D model viewer area:
  - Wireframe cube visualization
  - Cyan edges (#00D4FF)
  - Purple semi-transparent faces
  - Pink vertex points
  - Subtle grid pattern overlay (cyan, 5% opacity)
  - Radial glow effect behind model
- Model specifications card (glassmorphism):
  - Dimensions, Material, Features
  - Gray labels (#9CA3AF), cyan values (#00D4FF)
  - Monospace font for technical data
- Download buttons:
  - "Download STEP" (holographic gradient)
  - "Download STL" (outlined cyan)

**Recent Generations**
- Horizontal scrollable row
- Small thumbnail cards (glassmorphism)
- Dark background with cyan border
- Hover: glow effect and lift

---

### 2. 3D Model Viewer (Modal/Full Page)

**Viewer Container**
- Background: #0F1419
- Border: 1px solid rgba(0, 212, 255, 0.2)
- Border radius: 16px
- Box shadow: 0 8px 32px rgba(0, 0, 0, 0.6)
- Inset glow: 0 0 100px rgba(0, 212, 255, 0.05)
- Grid pattern overlay (cyan, 5% opacity, 50x50px)
- Radial glow effect in center

**Control Panel** (bottom center, floating)
- Background: rgba(26, 31, 38, 0.95)
- Backdrop filter: blur(20px)
- Border: 1px solid rgba(0, 212, 255, 0.3)
- Border radius: 16px
- Padding: 12px 20px
- Box shadow: 0 8px 32px rgba(0, 0, 0, 0.6)
- Buttons: Rotate left, Rotate right, Zoom in, Zoom out, Reset, Fullscreen, Download
- Each button: 40x40px, rgba(0, 212, 255, 0.1) bg, cyan icon, cyan border
- Hover: brighter background, glow shadow (0 0 20px rgba(0, 212, 255, 0.4))

**Model Stats Panel** (top right, floating)
- Background: rgba(26, 31, 38, 0.95)
- Backdrop filter: blur(20px)
- Border: 1px solid rgba(0, 212, 255, 0.2)
- Border radius: 12px
- Padding: 16px
- Stats display:
  - Vertices: 1,234
  - Faces: 2,456
  - Edges: 3,678
  - Volume: 45 cm³
  - Format: STEP
- Labels: Gray (#9CA3AF), Values: Cyan (#00D4FF), monospace font
- Dividers: rgba(255, 255, 255, 0.05)

---

### 3. Product Card Component

**Card Structure (Glassmorphism)**
- Background: rgba(26, 31, 38, 0.8)
- Backdrop filter: blur(20px)
- Border: 1px solid rgba(0, 212, 255, 0.1)
- Border radius: 16px
- Padding: 20px
- Box shadow: 0 4px 24px rgba(0, 0, 0, 0.4)
- Inset highlight: 0 1px 0 rgba(255, 255, 255, 0.05)

**Content**
- 3D model thumbnail (cyan wireframe with purple faces)
- Product name (white, bold, gradient on hover)
- Specifications with icons:
  - ⚡ High Torque (cyan icon)
  - 📏 20x40x40mm (purple icon)
  - ⚙️ 180° Rotation (pink icon)
- Price: $24.99 (cyan, bold, large)
- CTA button: "View 3D Model →" (holographic gradient)

**Hover Effect**
- Lift up 4px
- Cyan glow shadow: 0 0 30px rgba(0, 212, 255, 0.4)
- Border becomes brighter: rgba(0, 212, 255, 0.3)
- Smooth transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1)

---

## Button Styles

### Primary Button (Holographic)
```
Background: linear-gradient(135deg, #00D4FF 0%, #6B46C1 100%)
Color: white
Padding: 12px 32px
Border radius: 12px
Font weight: 600
Box shadow: 0 4px 16px rgba(0, 212, 255, 0.3)
Inset highlight: 0 1px 0 rgba(255, 255, 255, 0.2)
Hover: Shine effect (moving gradient overlay)
Active: Slightly darker, reduced shadow
```

### Secondary Button (Outlined)
```
Background: transparent
Color: #00D4FF
Border: 2px solid #00D4FF
Padding: 12px 32px
Border radius: 12px
Font weight: 600
Hover: Background rgba(0, 212, 255, 0.1), glow shadow (0 0 20px rgba(0, 212, 255, 0.3))
```

### Ghost Button
```
Background: rgba(255, 255, 255, 0.05)
Color: #E5E7EB
Border: 1px solid rgba(255, 255, 255, 0.1)
Padding: 12px 32px
Border radius: 12px
Backdrop filter: blur(10px)
Hover: Brighter background, cyan border
```

### Icon Button
```
Size: 40x40px
Background: rgba(0, 212, 255, 0.1)
Border: 1px solid rgba(0, 212, 255, 0.3)
Border radius: 8px
Icon color: #00D4FF
Hover: Brighter background, glow effect, scale up slightly
```

---

## Input Fields

### Text Input
```
Background: rgba(255, 255, 255, 0.05)
Border: 1px solid rgba(0, 212, 255, 0.2)
Border radius: 12px
Padding: 12px 16px
Font size: 16px
Color: #E5E7EB
Placeholder color: #6B7280
Focus: Cyan border (rgba(0, 212, 255, 0.5)), glow shadow (0 0 0 4px rgba(0, 212, 255, 0.1))
```

### Textarea
```
Same as text input
Min height: 120px
Resize: vertical
Backdrop filter: blur(10px)
```

### Select Dropdown
```
Same as text input
Dropdown arrow on right (cyan)
Expanded: Dark background, cyan selected item with glow
```

### Radio Buttons
```
Unchecked: Cyan circle outline
Checked: Cyan filled circle with white center dot, glow effect
Size: 20px
```

### Checkboxes
```
Unchecked: Cyan square outline
Checked: Cyan filled square with white checkmark, glow effect
Size: 20px
Border radius: 4px
```

---

## Loading States

### Rotating Cube Loader
- Wireframe cube with holographic gradient
- 3D rotation animation
- Text below: "Analyzing 3D model..." (gray)
- Progress bar: Cyan gradient fill, dark gray track
- Glow effect on progress

### Wireframe Spinner
- Circular wireframe with cyan outline
- Rotating center point (pink)
- Smooth rotation animation
- Text: "Processing..." (gray)

### Particle Loader
- Floating particles (cyan, purple, pink)
- Pulsing center point
- Text: "Generating model..." (gray)

### Shimmer Skeleton
- Dark gray base (rgba(255, 255, 255, 0.05))
- Cyan shimmer animation moving left to right
- Use for card placeholders

---

## Animations

### Hover Effects
```
Transform: translateY(-2px to -4px)
Transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
Shadow: Cyan glow (0 0 30px rgba(0, 212, 255, 0.4))
Border: Brighter cyan
```

### Shine Effect (for buttons)
```
Pseudo-element with gradient overlay
Animation: Move from left to right on hover
Duration: 0.5s
Gradient: transparent → rgba(255,255,255,0.3) → transparent
```

### Pulse Glow
```
Keyframes: Alternate between normal and stronger glow
Duration: 2s infinite
Shadow: 0 0 20px rgba(0, 212, 255, 0.3) to 0 0 40px rgba(0, 212, 255, 0.6)
```

### 3D Rotation
```
Keyframes: rotateY(0deg) rotateX(0deg) to rotateY(360deg) rotateX(360deg)
Duration: 20s infinite
Timing: linear
```

### Card Entrance
```
Fade in + slide up from bottom
Opacity: 0 to 1
Transform: translateY(20px) to translateY(0)
Duration: 0.5s ease-out
Stagger delay: 0.1s between cards
```

---

## Responsive Design

### Desktop (1200px+)
- Three-column feature cards
- Two-column CAD generator layout
- Full navigation bar
- Large 3D viewer

### Tablet (768px - 1199px)
- Two-column feature cards
- Stacked CAD generator layout
- Condensed navigation
- Medium 3D viewer

### Mobile (< 768px)
- Single column layout
- Hamburger menu (animated)
- Full-width cards
- Stacked buttons
- Simplified 3D viewer controls (bottom sheet)
- Touch-optimized interactions

---

## Special Effects

### Glassmorphism
```
Background: rgba(26, 31, 38, 0.8)
Backdrop filter: blur(20px) saturate(180%)
Border: 1px solid rgba(0, 212, 255, 0.1)
Box shadow: 0 4px 24px rgba(0, 0, 0, 0.4)
Inset highlight: 0 1px 0 rgba(255, 255, 255, 0.05)
```

### Gradient Mesh Background
```
Base: #0F1419
Radial gradients:
- 20% 50%: rgba(0, 212, 255, 0.05)
- 80% 50%: rgba(107, 70, 193, 0.05)
Blend mode: normal
```

### Grid Pattern Overlay
```
Background image: Linear gradients creating grid
Color: rgba(0, 212, 255, 0.05)
Size: 50px x 50px
Blend mode: overlay
```

### Glow Effects
```
Box shadow: 0 0 30px rgba(0, 212, 255, 0.4)
Multiple shadows for depth
Animated pulse for emphasis
```

### Holographic Border
```
Border: 1px solid transparent
Background: linear-gradient(135deg, #00D4FF, #6B46C1, #FF6B9D)
Background-clip: padding-box
Animated gradient rotation
```

---

## Notifications & Alerts

### Success Alert
```
Background: rgba(16, 185, 129, 0.1)
Border: 1px solid #10B981
Icon: Green checkmark with glow
Text: #E5E7EB
Backdrop blur
```

### Error Alert
```
Background: rgba(239, 68, 68, 0.1)
Border: 1px solid #EF4444
Icon: Red warning with glow
Text: #E5E7EB
Backdrop blur
```

### Info Alert
```
Background: rgba(0, 212, 255, 0.1)
Border: 1px solid #00D4FF
Icon: Cyan info with glow
Text: #E5E7EB
Backdrop blur
```

### Toast Notification
```
Background: rgba(26, 31, 38, 0.95)
Backdrop blur: 20px
Border: 1px solid rgba(0, 212, 255, 0.3)
Border radius: 12px
Box shadow: 0 10px 30px rgba(0, 0, 0, 0.6)
Slide in from top-right
Auto-dismiss after 3 seconds
Glow effect
```

---

## Accessibility Requirements

- **Contrast Ratios**: Minimum 4.5:1 for normal text, 3:1 for large text (test against dark backgrounds)
- **Focus States**: Clear cyan outline with glow on all interactive elements
- **Keyboard Navigation**: Full support with visible focus indicators
- **ARIA Labels**: Proper labels for all interactive components
- **Alt Text**: Descriptive alt text for all images and icons
- **Screen Reader**: Semantic HTML with proper heading hierarchy
- **Reduced Motion**: Respect prefers-reduced-motion for animations

---

## Technical Implementation Notes

### CSS Variables
```css
:root {
  --primary: #00D4FF;
  --primary-dark: #0099CC;
  --secondary: #6B46C1;
  --accent: #FF6B9D;
  --metallic: #C0C0C0;
  --bg-dark: #0F1419;
  --surface-dark: #1A1F26;
  --elevated: #252B35;
  --text: #E5E7EB;
  --text-secondary: #9CA3AF;
  --border: rgba(0, 212, 255, 0.2);
  --glow: rgba(0, 212, 255, 0.4);
}
```

### Recommended Libraries
- **3D Viewer**: Three.js or React Three Fiber
- **Animations**: Framer Motion
- **Icons**: Lucide React or Heroicons
- **Particles**: tsparticles (lightweight)
- **UI Components**: Radix UI or Headless UI
- **Styling**: Tailwind CSS with custom dark theme config

### Performance Optimizations
- Use CSS transforms over position changes
- Implement lazy loading for 3D models
- Optimize with will-change for animated elements
- Use requestAnimationFrame for smooth animations
- Implement virtual scrolling for long lists
- Compress and optimize all assets

---

## Priority Features for Prototype

### Must Have (MVP)
1. Homepage with animated hero section and feature cards
2. CAD Generator interface with glassmorphism
3. 3D Model Viewer with controls and stats
4. Product card component with hover effects
5. Responsive navigation with backdrop blur
6. Button and input components with glow effects
7. Loading states with 3D animations

### Nice to Have
1. Particle background effects
2. Advanced 3D viewer controls
3. Modal dialogs with glassmorphism
4. Toast notifications with animations
5. Recent generations history
6. User authentication UI
7. Settings page with theme toggle

---

## Design Philosophy

**Dark Mode First**: Emphasize depth, glow effects, and holographic elements that shine in dark environments - perfect for tech demos and late-night hackathons.

**3D-Focused**: Every design element reinforces the 3D modeling capabilities through wireframe aesthetics, metallic gradients, and spatial depth.

**Futuristic & Tech-Forward**: Holographic gradients, glassmorphism, glow effects, and smooth animations create a cutting-edge cyberpunk aesthetic.

**Hackathon-Ready**: Impressive visual effects that wow judges while maintaining usability and performance.

---

## Success Criteria

✅ Stunning dark mode aesthetic with holographic effects
✅ Strong visual emphasis on 3D modeling capabilities
✅ Smooth, performant animations (60fps)
✅ Fully responsive across all devices
✅ Accessible to all users (WCAG 2.1 AA compliance)
✅ Consistent use of cyan/purple/pink color scheme
✅ Interactive 3D model viewer as centerpiece
✅ Glassmorphism and depth effects throughout
✅ Clear call-to-actions with glow effects
✅ Impressive enough to win hackathon demos

---

**Build this prototype with Lovable focusing on the dark theme aesthetic, futuristic holographic effects, and showcasing the 3D CAD analysis capabilities through metallic wireframes, cyan glows, and glassmorphism - designed to impress at hackathon presentations.**
