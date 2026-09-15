# SteelSmart Design System - Light Theme (3D Model Focus)

## 🎨 Brand Identity - Light Mode

### Logo Concepts (Light Theme Optimized)

#### Recommended: "Gradient Mesh Cube"
```
Visual: Wireframe 3D cube with vibrant gradient
- Clean wireframe structure with depth
- Gradient: Deep Blue → Cyan → Purple
- Works beautifully on white backgrounds
- Professional yet modern
```

### Logo Color Variations
```
Primary Mark (Light BG):
┌─────────┐
│  ╱╲  ╱╲ │  Wireframe 3D cube
│ ╱  ╲╱  ╲│  Gradient: #0066CC → #00D4FF → #6B46C1
│╱    ╲   │  
└─────────┘

Alternative (Solid):
- Single color: Deep Blue (#0066CC)
- For small sizes and favicons
- Maintains clarity at any size
```

---

## 🎨 Color Palette - Light Theme

### Primary Colors
```css
/* Main Brand Colors */
--steelsmart-primary: #0066CC;        /* Deep Blue - Professional */
--steelsmart-primary-dark: #004C99;   /* Darker Blue */
--steelsmart-primary-light: #3399FF;  /* Light Blue */

--steelsmart-secondary: #6B46C1;      /* Purple - Innovation */
--steelsmart-secondary-dark: #553399; /* Dark Purple */
--steelsmart-secondary-light: #9B7FD9;/* Light Purple */

--steelsmart-accent: #00D4FF;         /* Cyan - Tech accent */
--steelsmart-accent-warm: #FF6B9D;    /* Pink - CTAs */
--steelsmart-success: #10B981;        /* Green - Success states */
--steelsmart-warning: #F59E0B;        /* Amber - Warnings */
--steelsmart-error: #EF4444;          /* Red - Errors */
```

### Neutral Colors (Light Theme)
```css
--steelsmart-white: #FFFFFF;          /* Pure white */
--steelsmart-gray-50: #F9FAFB;        /* Lightest gray - backgrounds */
--steelsmart-gray-100: #F3F4F6;       /* Light gray - surfaces */
--steelsmart-gray-200: #E5E7EB;       /* Borders */
--steelsmart-gray-300: #D1D5DB;       /* Dividers */
--steelsmart-gray-400: #9CA3AF;       /* Disabled text */
--steelsmart-gray-500: #6B7280;       /* Secondary text */
--steelsmart-gray-600: #4B5563;       /* Body text */
--steelsmart-gray-700: #374151;       /* Headings */
--steelsmart-gray-800: #1F2937;       /* Dark text */
--steelsmart-gray-900: #111827;       /* Darkest - emphasis */
```

### Surface Colors
```css
--surface-base: #FFFFFF;            /* Main background */
--surface-elevated: #F9FAFB;        /* Cards, panels */
--surface-overlay: rgba(255, 255, 255, 0.95); /* Modals */
--surface-hover: #F3F4F6;           /* Hover states */
--surface-active: #E5E7EB;          /* Active states */
```

### Gradient Definitions
```css
--gradient-primary: linear-gradient(135deg, #0066CC 0%, #00D4FF 100%);
--gradient-secondary: linear-gradient(135deg, #6B46C1 0%, #9B7FD9 100%);
--gradient-accent: linear-gradient(135deg, #00D4FF 0%, #6B46C1 100%);
--gradient-warm: linear-gradient(135deg, #FF6B9D 0%, #FF9A76 100%);
--gradient-mesh: linear-gradient(135deg, #0066CC 0%, #00D4FF 50%, #6B46C1 100%);
--gradient-subtle: linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%);
```

### 3D Model Visualization Colors (Light Theme)
```css
--model-edge: #0066CC;              /* Wireframe edges - deep blue */
--model-face: rgba(0, 212, 255, 0.15); /* Semi-transparent faces */
--model-vertex: #6B46C1;            /* Vertex points - purple */
--model-grid: rgba(0, 102, 204, 0.08); /* Background grid */
--model-shadow: rgba(0, 0, 0, 0.1); /* Soft shadows */
--model-highlight: rgba(0, 212, 255, 0.3); /* Highlights */
```

### Shadow System
```css
/* Elevation Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.15);

/* Colored Shadows for 3D Effect */
--shadow-primary: 0 10px 30px rgba(0, 102, 204, 0.15);
--shadow-accent: 0 10px 30px rgba(0, 212, 255, 0.2);
--shadow-glow: 0 0 30px rgba(0, 212, 255, 0.3);
```

---

## 🎭 UI Theme - Light Mode

### Background Layers
```css
/* Base Layer */
body {
  background: #FFFFFF;
  background-image: 
    radial-gradient(circle at 20% 20%, rgba(0, 212, 255, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(107, 70, 193, 0.03) 0%, transparent 50%);
}

/* Subtle Pattern Overlay */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 102, 204, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 102, 204, 0.02) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: -1;
}

/* Card Surfaces */
.card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.05),
    0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 
    0 10px 30px rgba(0, 102, 204, 0.1),
    0 4px 10px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
  border-color: rgba(0, 212, 255, 0.3);
}

/* Elevated Surfaces */
.elevated {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* Glass Effect (Light Mode) */
.glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(0, 102, 204, 0.1);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}
```

### Typography
```css
/* Headings */
h1, h2, h3 {
  font-family: 'Inter', -apple-system, sans-serif;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #111827;
}

/* Gradient Text for Emphasis */
.gradient-text {
  background: linear-gradient(135deg, #0066CC 0%, #00D4FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Body Text */
body {
  font-family: 'Inter', -apple-system, sans-serif;
  color: #4B5563;
  line-height: 1.6;
}

/* Secondary Text */
.text-secondary {
  color: #6B7280;
}

/* Muted Text */
.text-muted {
  color: #9CA3AF;
}

/* Code/Technical */
code, .technical {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: #0066CC;
  background: #F3F4F6;
  padding: 2px 6px;
  border-radius: 4px;
}
```

### Button Styles (Light Theme)
```css
/* Primary Button - Gradient */
.btn-primary {
  background: linear-gradient(135deg, #0066CC 0%, #00D4FF 100%);
  color: white;
  padding: 12px 32px;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  box-shadow: 
    0 4px 12px rgba(0, 102, 204, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  box-shadow: 
    0 6px 20px rgba(0, 102, 204, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 102, 204, 0.3);
}

/* Secondary Button - Outlined */
.btn-secondary {
  background: white;
  color: #0066CC;
  padding: 12px 32px;
  border-radius: 12px;
  border: 2px solid #0066CC;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #F0F9FF;
  border-color: #00D4FF;
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2);
}

/* Tertiary Button - Subtle */
.btn-tertiary {
  background: #F3F4F6;
  color: #4B5563;
  padding: 12px 32px;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-tertiary:hover {
  background: #E5E7EB;
  border-color: #D1D5DB;
}

/* Icon Button */
.btn-icon {
  width: 40px;
  height: 40px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4B5563;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  background: #F9FAFB;
  border-color: #00D4FF;
  color: #0066CC;
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.15);
}
```

---

## 🎬 3D Model Viewer Theme (Light Mode)

### Viewer Container
```css
.model-viewer {
  background: linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%);
  border-radius: 16px;
  border: 2px solid #E5E7EB;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  position: relative;
  overflow: hidden;
}

/* Subtle Grid Background */
.model-viewer::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 102, 204, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 102, 204, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

/* Ambient Light Effect */
.model-viewer::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(0, 212, 255, 0.08) 0%,
    transparent 50%
  );
  pointer-events: none;
  animation: ambient-rotate 20s linear infinite;
}

@keyframes ambient-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Control Panel (Light Mode)
```css
.viewer-controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(0, 102, 204, 0.15);
  border-radius: 16px;
  padding: 12px 20px;
  display: flex;
  gap: 12px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.control-btn {
  width: 40px;
  height: 40px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  color: #0066CC;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:hover {
  background: #F0F9FF;
  border-color: #00D4FF;
  color: #0066CC;
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2);
  transform: translateY(-2px);
}

.control-btn:active {
  transform: translateY(0);
}
```

### Model Stats Display (Light Mode)
```css
.model-stats {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(0, 102, 204, 0.15);
  border-radius: 12px;
  padding: 16px;
  min-width: 200px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #F3F4F6;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #6B7280;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.stat-value {
  color: #0066CC;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}
```

---

## 🎯 Component Patterns (Light Theme)

### Hero Section
```css
.hero {
  background: linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%);
  position: relative;
  overflow: hidden;
}

/* Decorative Elements */
.hero::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 80%;
  height: 150%;
  background: radial-gradient(
    circle,
    rgba(0, 212, 255, 0.08) 0%,
    transparent 70%
  );
  pointer-events: none;
}

.hero::after {
  content: '';
  position: absolute;
  bottom: -50%;
  left: -20%;
  width: 80%;
  height: 150%;
  background: radial-gradient(
    circle,
    rgba(107, 70, 193, 0.06) 0%,
    transparent 70%
  );
  pointer-events: none;
}
```

### Card Design - Modern Light
```css
.feature-card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* Gradient Border on Hover */
.feature-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  padding: 2px;
  background: linear-gradient(135deg, #00D4FF, #6B46C1);
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-card:hover {
  box-shadow: 
    0 12px 40px rgba(0, 102, 204, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-4px);
}

/* Icon Container */
.card-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #0066CC 0%, #00D4FF 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.2);
}
```

### Input Fields (Light Theme)
```css
.input-field {
  background: white;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 16px;
  color: #111827;
  transition: all 0.3s ease;
}

.input-field:focus {
  outline: none;
  border-color: #00D4FF;
  box-shadow: 
    0 0 0 4px rgba(0, 212, 255, 0.1),
    0 4px 12px rgba(0, 212, 255, 0.15);
}

.input-field::placeholder {
  color: #9CA3AF;
}

/* With Icon */
.input-with-icon {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #6B7280;
}

.input-with-icon input {
  padding-left: 48px;
}
```

---

## 🎨 Animation Guidelines (Light Theme)

### Hover Effects
```css
/* Lift and Shadow */
.interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 102, 204, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Glow Effect */
.glow-on-hover:hover {
  box-shadow: 
    0 0 20px rgba(0, 212, 255, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Scale Up */
.scale-on-hover:hover {
  transform: scale(1.02);
}
```

### Loading States
```css
/* Shimmer Effect */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #F3F4F6 0%,
    #E5E7EB 50%,
    #F3F4F6 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}

/* Pulse */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

---

## 🎪 Special Effects (Light Theme)

### Gradient Mesh Background
```css
.gradient-mesh {
  background: 
    radial-gradient(at 0% 0%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
    radial-gradient(at 100% 0%, rgba(107, 70, 193, 0.08) 0%, transparent 50%),
    radial-gradient(at 100% 100%, rgba(0, 102, 204, 0.06) 0%, transparent 50%),
    radial-gradient(at 0% 100%, rgba(255, 107, 157, 0.05) 0%, transparent 50%),
    #FFFFFF;
}
```

### Floating Elements
```css
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

.floating {
  animation: float 6s ease-in-out infinite;
}
```

### Shine Effect
```css
.shine {
  position: relative;
  overflow: hidden;
}

.shine::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.6),
    transparent
  );
  transition: left 0.5s;
}

.shine:hover::after {
  left: 100%;
}
```

---

## 📊 Comparison: Light vs Dark

### When to Use Light Theme:
✅ Professional/corporate presentations
✅ Daytime hackathon demos
✅ Print materials and documentation
✅ Accessibility requirements
✅ Traditional engineering audiences
✅ Better for detailed technical drawings

### Advantages:
- Higher contrast for text readability
- Better for bright environments
- More professional/traditional feel
- Easier on eyes in daylight
- Better for color-coded information
- Cleaner, more spacious feel

---

## 🚀 Quick Implementation

### Update CSS Variables
```css
:root {
  /* Light Theme Colors */
  --primary: #0066CC;
  --secondary: #6B46C1;
  --accent: #00D4FF;
  --background: #FFFFFF;
  --surface: #F9FAFB;
  --text: #111827;
  --text-secondary: #6B7280;
  --border: #E5E7EB;
}
```

### Toggle Support
```css
/* Add data-theme attribute support */
[data-theme="light"] {
  --primary: #0066CC;
  --background: #FFFFFF;
  /* ... other light colors */
}

[data-theme="dark"] {
  --primary: #00D4FF;
  --background: #0F1419;
  /* ... other dark colors */
}
```

---

## 🎯 Hackathon Tips (Light Theme)

1. **High Contrast**: Use deep blues and purples for maximum impact
2. **Clean Backgrounds**: White space makes 3D models pop
3. **Subtle Patterns**: Light grid patterns add depth without distraction
4. **Colorful Accents**: Use cyan and purple for CTAs and highlights
5. **Professional Feel**: Light theme = more corporate/professional
6. **Better Screenshots**: Light theme screenshots look better in presentations

---

**Design Philosophy**: Clean, professional, and modern with vibrant accents. The light theme emphasizes clarity and precision while maintaining the futuristic 3D modeling focus through strategic use of gradients, shadows, and subtle effects.
