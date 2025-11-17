# Lovable Prompt: Metalyze Light Theme UI Prototype

## Project Overview
Create a modern, professional web application for **Metalyze** - an AI-powered 3D CAD analysis platform. The design should emphasize clean aesthetics, technical precision, and 3D modeling capabilities with a light theme optimized for presentations and professional environments.

---

## Brand Identity

### Logo
- **Primary Logo**: Wireframe 3D cube with gradient (Deep Blue → Cyan → Purple)
- **Colors**: #0066CC → #00D4FF → #6B46C1
- **Style**: Clean geometric wireframe with depth
- **Tagline**: "AI-Powered CAD Analysis"

### Typography
- **Font Family**: Inter (sans-serif) for all text
- **Headings**: Font weight 700, letter-spacing -0.02em, color #111827
- **Body Text**: Font weight 400, color #4B5563, line-height 1.6
- **Code/Technical**: JetBrains Mono, color #0066CC

---

## Color Palette

### Primary Colors
```
Primary Blue: #0066CC (main brand color)
Primary Dark: #004C99
Primary Light: #3399FF
Secondary Purple: #6B46C1
Secondary Light: #9B7FD9
Accent Cyan: #00D4FF
Accent Warm: #FF6B9D
Success Green: #10B981
Warning Amber: #F59E0B
Error Red: #EF4444
```

### Neutral Colors
```
White: #FFFFFF
Gray 50: #F9FAFB (lightest backgrounds)
Gray 100: #F3F4F6 (surfaces)
Gray 200: #E5E7EB (borders)
Gray 300: #D1D5DB (dividers)
Gray 500: #6B7280 (secondary text)
Gray 600: #4B5563 (body text)
Gray 700: #374151 (headings)
Gray 900: #111827 (darkest emphasis)
```

### Gradients
```
Primary Gradient: linear-gradient(135deg, #0066CC 0%, #00D4FF 100%)
Secondary Gradient: linear-gradient(135deg, #6B46C1 0%, #9B7FD9 100%)
Accent Gradient: linear-gradient(135deg, #00D4FF 0%, #6B46C1 100%)
Mesh Gradient: linear-gradient(135deg, #0066CC 0%, #00D4FF 50%, #6B46C1 100%)
```

---

## Layout Structure

### Homepage Layout

**Header/Navigation**
- Logo on left (wireframe cube + "METALYZE" text)
- Navigation links: CAD Generator, Analyzer, Catalog
- Login button on right (blue gradient)
- White background with subtle bottom border (#E5E7EB)
- Sticky on scroll

**Hero Section**
- White to light gray gradient background (#FFFFFF → #F9FAFB)
- Subtle radial gradient overlays (cyan and purple at 3-5% opacity)
- Large wireframe cube illustration (blue gradient)
- Heading: "METALYZE" with gradient text effect
- Subheading: "AI-Powered 3D CAD Analysis"
- Description: "Transform technical drawings into intelligent 3D models"
- Two CTAs:
  - Primary: "Start Analyzing →" (blue gradient button)
  - Secondary: "View Demo" (outlined blue button)
- Stats row: "500+ Models • 98% Accuracy • 24h Quotes"

**Feature Cards Section**
- Three cards in a row (responsive grid)
- Each card:
  - White background
  - Border: 1px solid #E5E7EB
  - Border radius: 16px
  - Padding: 24px
  - Subtle shadow: 0 4px 6px rgba(0,0,0,0.05)
  - Icon container: 56x56px with blue gradient background
  - Hover effect: lift up 4px, blue glow shadow, border changes to cyan

**Card 1: CAD Generator**
- Icon: Geometric shapes (blue gradient)
- Title: "CAD Generator"
- Description: "Generate 3D models from text descriptions"

**Card 2: 3D Viewer**
- Icon: Rotation symbols (cyan gradient)
- Title: "3D Viewer Preview"
- Description: "Interactive model rotation and inspection"

**Card 3: AI Match Engine**
- Icon: Directional arrows (purple gradient)
- Title: "AI Match Engine"
- Description: "Smart product matching and recommendations"

---

## Key Pages/Components

### 1. CAD Generator Interface

**Layout**: Two-column split (40% input / 60% preview)

**Left Panel - Input**
- White card background
- AI icon with "Metalyze AI" heading
- Large textarea:
  - Placeholder: "Describe your component..."
  - White background
  - Border: 2px solid #E5E7EB
  - Focus: Blue border (#00D4FF) with glow shadow
- Format selection (radio buttons):
  - STEP, STL, OBJ, DXF
  - Blue when selected
- Primary button: "Generate 3D Model →" (blue gradient)

**Right Panel - Preview**
- Light gray background (#F9FAFB)
- 3D model viewer area:
  - Wireframe cube visualization
  - Blue edges (#0066CC)
  - Cyan semi-transparent faces (rgba(0, 212, 255, 0.15))
  - Purple vertex points (#6B46C1)
  - Subtle grid pattern overlay
- Model specifications card:
  - Dimensions, Material, Features
  - Gray labels, blue values
- Download buttons:
  - "Download STEP" (blue gradient)
  - "Download STL" (blue outlined)

**Recent Generations**
- Horizontal scrollable row
- Small thumbnail cards
- White background with shadow
- Hover: blue border glow

---

### 2. 3D Model Viewer (Modal/Full Page)

**Viewer Container**
- White to light gray gradient background
- Subtle blue grid pattern (40x40px, 5% opacity)
- Border: 2px solid #E5E7EB
- Border radius: 16px
- Large 3D model display area

**Control Panel** (bottom center, floating)
- White background with backdrop blur
- Border: 1px solid rgba(0, 102, 204, 0.15)
- Border radius: 16px
- Padding: 12px 20px
- Buttons: Rotate left, Rotate right, Zoom in, Zoom out, Reset, Fullscreen, Download
- Each button: 40x40px, white bg, blue icon, gray border
- Hover: light blue background, blue border, lift effect

**Model Stats Panel** (top right, floating)
- White background with backdrop blur
- Border: 1px solid rgba(0, 102, 204, 0.15)
- Border radius: 12px
- Stats display:
  - Vertices: 1,234
  - Faces: 2,456
  - Edges: 3,678
  - Volume: 45 cm³
  - Format: STEP
- Labels: Gray (#6B7280), Values: Blue (#0066CC), monospace font

---

### 3. Product Card Component

**Card Structure**
- White background
- Border: 1px solid #E5E7EB
- Border radius: 16px
- Padding: 20px
- Box shadow: 0 4px 6px rgba(0,0,0,0.05)

**Content**
- 3D model thumbnail (blue gradient wireframe)
- Product name (dark gray, bold)
- Specifications with icons:
  - ⚡ High Torque
  - 📏 20x40x40mm
  - ⚙️ 180° Rotation
- Price: $24.99 (blue, bold, large)
- CTA button: "View 3D Model →" (blue gradient)

**Hover Effect**
- Lift up 4px
- Blue glow shadow: 0 12px 40px rgba(0,102,204,0.12)
- Border color changes to cyan (#00D4FF)
- Smooth transition: 0.3s ease

---

## Button Styles

### Primary Button
```
Background: linear-gradient(135deg, #0066CC, #00D4FF)
Color: white
Padding: 12px 32px
Border radius: 12px
Font weight: 600
Shadow: 0 4px 12px rgba(0,102,204,0.25)
Hover: Lift 2px, stronger shadow
```

### Secondary Button (Outlined)
```
Background: white
Color: #0066CC
Border: 2px solid #0066CC
Padding: 12px 32px
Border radius: 12px
Font weight: 600
Hover: Light blue background (#F0F9FF), cyan border, glow shadow
```

### Tertiary Button
```
Background: #F3F4F6
Color: #4B5563
Border: 1px solid #E5E7EB
Padding: 12px 32px
Border radius: 12px
Hover: Darker gray background (#E5E7EB)
```

### Icon Button
```
Size: 40x40px
Background: white
Border: 1px solid #E5E7EB
Border radius: 10px
Icon color: #0066CC
Hover: Light blue bg, cyan border, lift effect
```

---

## Input Fields

### Text Input
```
Background: white
Border: 2px solid #E5E7EB
Border radius: 12px
Padding: 12px 16px
Font size: 16px
Color: #111827
Placeholder color: #9CA3AF
Focus: Blue border (#00D4FF), glow shadow (0 0 0 4px rgba(0,212,255,0.1))
```

### Textarea
```
Same as text input
Min height: 120px
Resize: vertical
```

### Select Dropdown
```
Same as text input
Dropdown arrow on right
Expanded: White background, blue selected item
```

### Radio Buttons
```
Unchecked: Gray circle outline
Checked: Blue filled circle with white center dot
Size: 20px
```

### Checkboxes
```
Unchecked: Gray square outline
Checked: Blue filled square with white checkmark
Size: 20px
Border radius: 4px
```

---

## Loading States

### Rotating Cube Loader
- Wireframe cube with blue gradient
- Rotation animation
- Text below: "Analyzing 3D model..." (gray)
- Progress bar: Blue fill, light gray track

### Shimmer Skeleton
- Light gray background (#F3F4F6 to #E5E7EB)
- Shimmer animation moving left to right
- Use for card placeholders

### Spinner
- Circular spinner with blue gradient
- Size: 40px
- Smooth rotation

---

## Animations

### Hover Effects
```
Transform: translateY(-2px to -4px)
Transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
Shadow: Increase intensity
Border: Change to cyan/blue
```

### Button Press
```
Active state: translateY(0), reduced shadow
Ripple effect on click
```

### Card Entrance
```
Fade in + slide up
Stagger delay for multiple cards
Duration: 0.5s ease-out
```

### Logo Animation (on page load)
```
Draw wireframe lines sequentially
Fade in text
Apply gradient
Duration: 1.5s
```

---

## Responsive Design

### Desktop (1200px+)
- Three-column feature cards
- Two-column CAD generator layout
- Full navigation bar

### Tablet (768px - 1199px)
- Two-column feature cards
- Stacked CAD generator layout
- Condensed navigation

### Mobile (< 768px)
- Single column layout
- Hamburger menu
- Full-width cards
- Stacked buttons
- Simplified 3D viewer controls

---

## Special Effects

### Glassmorphism (for floating panels)
```
Background: rgba(255, 255, 255, 0.8)
Backdrop filter: blur(20px) saturate(180%)
Border: 1px solid rgba(0, 102, 204, 0.1)
Shadow: 0 8px 32px rgba(0, 0, 0, 0.08)
```

### Gradient Mesh Background
```
Base: White (#FFFFFF)
Radial gradients:
- Top-left: rgba(0, 212, 255, 0.03)
- Top-right: rgba(107, 70, 193, 0.03)
- Bottom: rgba(0, 102, 204, 0.02)
```

### Grid Pattern Overlay
```
Background image: Linear gradients creating grid
Color: rgba(0, 102, 204, 0.02)
Size: 50px x 50px
```

---

## Notifications & Alerts

### Success Alert
```
Background: Light green (#D1FAE5)
Border: Green (#10B981)
Icon: Green checkmark
Text: Dark gray
```

### Error Alert
```
Background: Light red (#FEE2E2)
Border: Red (#EF4444)
Icon: Red warning
Text: Dark gray
```

### Info Alert
```
Background: Light blue (#DBEAFE)
Border: Blue (#0066CC)
Icon: Blue info
Text: Dark gray
```

### Toast Notification
```
White background
Shadow: 0 10px 30px rgba(0,0,0,0.15)
Border radius: 12px
Slide in from top-right
Auto-dismiss after 3 seconds
```

---

## Accessibility Requirements

- **Contrast Ratios**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus States**: Clear blue outline on all interactive elements
- **Keyboard Navigation**: Full support with visible focus indicators
- **ARIA Labels**: Proper labels for all interactive components
- **Alt Text**: Descriptive alt text for all images and icons
- **Screen Reader**: Semantic HTML with proper heading hierarchy

---

## Technical Implementation Notes

### CSS Variables
```css
:root {
  --primary: #0066CC;
  --primary-light: #3399FF;
  --secondary: #6B46C1;
  --accent: #00D4FF;
  --bg: #FFFFFF;
  --surface: #F9FAFB;
  --text: #111827;
  --text-secondary: #6B7280;
  --border: #E5E7EB;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}
```

### Recommended Libraries
- **3D Viewer**: Three.js or React Three Fiber
- **Animations**: Framer Motion
- **Icons**: Lucide React or Heroicons
- **UI Components**: Radix UI or Headless UI
- **Styling**: Tailwind CSS with custom config

---

## Priority Features for Prototype

### Must Have (MVP)
1. Homepage with hero section and feature cards
2. CAD Generator interface with input/preview
3. 3D Model Viewer with basic controls
4. Product card component
5. Responsive navigation
6. Button and input components
7. Loading states

### Nice to Have
1. Modal dialogs
2. Toast notifications
3. Advanced 3D viewer controls
4. Recent generations history
5. User authentication UI
6. Settings page

---

## Design Philosophy

**Professional & Clean**: Light theme emphasizes clarity and precision, perfect for technical presentations and corporate environments.

**3D-Focused**: Every design element reinforces the 3D modeling capabilities through wireframe aesthetics, depth effects, and spatial awareness.

**Modern & Tech-Forward**: Gradient accents, glassmorphism, and smooth animations create a cutting-edge feel without sacrificing professionalism.

**User-Centric**: Clear hierarchy, intuitive interactions, and responsive design ensure excellent usability across all devices.

---

## Success Criteria

✅ Clean, professional appearance suitable for hackathon demos
✅ Strong visual emphasis on 3D modeling capabilities
✅ Smooth, performant animations and transitions
✅ Fully responsive across desktop, tablet, and mobile
✅ Accessible to all users (WCAG 2.1 AA compliance)
✅ Consistent use of brand colors and typography
✅ Interactive 3D model viewer as centerpiece
✅ Clear call-to-actions and user flow

---

**Build this prototype with Lovable focusing on the light theme aesthetic, professional presentation quality, and showcasing the 3D CAD analysis capabilities through clean design and strategic use of blue gradients, subtle shadows, and crisp white spaces.**
