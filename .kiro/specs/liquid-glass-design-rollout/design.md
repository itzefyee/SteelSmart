# Design Document

## Overview

This design document outlines the implementation strategy for applying the Liquid Glass design pattern across all card components in the Metalyze application. The liquid glass design creates a modern, cohesive visual aesthetic using translucent backgrounds, backdrop blur effects, subtle gradients, and layered shadows. This design is currently implemented in the Product Catalog and will be systematically rolled out to all other card-based UI components.

The implementation will leverage existing CSS utility classes (`.product-glass-card`, `.catalog-glass-container`) and create additional variants as needed to maintain consistency while allowing for component-specific customization.

## Architecture

### Design System Hierarchy

```
Liquid Glass Design System
├── Base Glass Containers (Large sections)
│   ├── .catalog-glass-container (existing)
│   └── .glass-container (new - general purpose)
├── Glass Cards (Individual items)
│   ├── .product-glass-card (existing)
│   ├── .glass-card (new - general purpose)
│   └── .glass-card-compact (new - smaller variant)
├── Glass Form Elements
│   ├── .glass-input (existing)
│   ├── .glass-checkbox (existing)
│   └── .glass-range (existing)
└── Glass Patterns & Effects
    ├── Grid patterns
    ├── Wire patterns
    └── Particle layers
```

### Component Categorization

Components are categorized by their current design state and priority for glass design application:

**Priority 1 - High Visibility Pages:**
- Home page AI Tools section
- Home page Product Categories section
- Product Recommender (already partially implemented)

**Priority 2 - Frequently Used Tools:**
- CAD Generator interface
- CAD Analyzer interface
- CAD History component

**Priority 3 - User Account & Management:**
- Account page sections
- Reports Manager
- RFQ Tracking

## Components and Interfaces

### 1. CSS Utility Classes

#### 1.1 New General Purpose Glass Container

```css
.glass-container {
  @apply relative rounded-3xl;
  background: rgba(160, 180, 200, 0.28);
  backdrop-filter: blur(50px) saturate(140%);
  -webkit-backdrop-filter: blur(50px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 8px 32px 0 rgba(15, 23, 42, 0.25),
    inset 0 1px 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
}
```

**Usage:** Large container sections like form panels, result containers, and page sections.

#### 1.2 New General Purpose Glass Card

```css
.glass-card {
  @apply relative overflow-hidden rounded-2xl;
  background: linear-gradient(
    145deg,
    rgba(240, 247, 255, 0.88) 0%,
    rgba(228, 239, 255, 0.82) 100%
  );
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border: 1.5px solid rgba(147, 197, 253, 0.45);
  box-shadow: 
    0 25px 45px 0 rgba(15, 23, 42, 0.25),
    0 12px 22px 0 rgba(15, 23, 42, 0.18),
    inset 0 1px 1px 0 rgba(255, 255, 255, 0.6);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  background: linear-gradient(
    145deg,
    rgba(236, 245, 255, 0.98) 0%,
    rgba(205, 232, 255, 0.94) 100%
  );
  border-color: rgba(59, 130, 246, 0.65);
  box-shadow: 
    0 34px 80px 0 rgba(15, 23, 42, 0.4),
    0 22px 46px 0 rgba(15, 23, 42, 0.3),
    inset 0 2px 4px 0 rgba(255, 255, 255, 0.4);
  transform: translateY(-6px) scale(1.02);
}
```

**Usage:** Individual cards for tools, categories, history items, reports, etc.

#### 1.3 Compact Glass Card Variant

```css
.glass-card-compact {
  @apply glass-card;
  @apply rounded-xl;
  padding: 1rem;
}

.glass-card-compact:hover {
  transform: translateY(-3px) scale(1.01);
}
```

**Usage:** Smaller cards in dense layouts like history lists or stat cards.

### 2. Home Page Components

#### 2.1 AI Tools Section (`/src/app/page.tsx`)

**Current State:** White cards with basic shadow
**Target State:** Glass cards with hover effects

**Implementation:**
- Replace `bg-white rounded-xl p-6 shadow-sm border hover:shadow-lg` with `glass-card p-6`
- Maintain existing icon gradients and text hierarchy
- Add glass card hover animation

**Code Changes:**
```tsx
// Before
<Link href="/cad-generator" className="group bg-white rounded-xl p-6 shadow-sm border hover:shadow-lg transition-all">

// After
<Link href="/cad-generator" className="group glass-card p-6">
```

#### 2.2 Category Showcase (`/src/components/layout/CategoryShowcase.tsx`)

**Current State:** White cards with gradient backgrounds for icons
**Target State:** Glass cards with enhanced visual depth

**Implementation:**
- Replace `bg-white rounded-xl p-6 shadow-sm hover:shadow-lg` with `glass-card p-6`
- Maintain category icon gradients
- Ensure text contrast remains high

### 3. CAD Generator Components

#### 3.1 Main Generator Interface (`/src/components/cad/CADGenerator.tsx`)

**Current State:** White background containers
**Target State:** Glass containers for all major sections

**Sections to Update:**
1. **Tab Container:** Apply `.glass-container` to the main tab wrapper
2. **Text Input Chat Interface:** Apply `.glass-card` to chat message bubbles
3. **Template Cards:** Apply `.glass-card` to ML prompt template buttons
4. **Generated Drawing Display:** Apply `.glass-container` to the result panel
5. **Parameter Editor Modal:** Apply glass styling to modal content

**Implementation Strategy:**
- Wrap main content areas in `.glass-container`
- Convert individual interactive cards to `.glass-card`
- Maintain existing functionality and layout
- Ensure form inputs use `.glass-input` class

#### 3.2 CAD History Component (`/src/components/cad/CADHistory.tsx`)

**Current State:** White background with border
**Target State:** Glass container with glass card items

**Implementation:**
- Main container: `.glass-container` instead of `bg-white rounded-lg shadow border`
- Individual history items: `.glass-card-compact` for collapsed state
- Expanded items: Maintain `.glass-card-compact` with additional content
- Status indicators: Ensure visibility with appropriate contrast

**Code Pattern:**
```tsx
// Container
<div className="glass-container p-4">
  {/* History items */}
  {history.map((item) => (
    <div key={item.id} className="glass-card-compact mb-3">
      {/* Item content */}
    </div>
  ))}
</div>
```

### 4. CAD Analyzer Components

#### 4.1 Main Analyzer Interface (`/src/components/cad/CADAnalyzer.tsx`)

**Current State:** White card with border
**Target State:** Glass container with glass upload area

**Implementation:**
- Main wrapper: `.glass-container` instead of `bg-white rounded-xl shadow-lg border`
- Upload dropzone: Custom glass styling with dashed border
- Sample drawing cards: `.glass-card-compact`
- Result sections: `.glass-card` for analysis results

**Upload Area Styling:**
```css
.glass-upload-zone {
  @apply glass-card;
  border: 2px dashed rgba(147, 197, 253, 0.6);
  background: linear-gradient(
    145deg,
    rgba(248, 250, 252, 0.95) 0%,
    rgba(241, 245, 249, 0.90) 100%
  );
}

.glass-upload-zone:hover {
  border-color: rgba(59, 130, 246, 0.8);
}
```

### 5. Product Recommender Components

#### 5.1 ProductRecommenderNew (`/src/components/products/ProductRecommenderNew.tsx`)

**Current State:** Partially implemented with white cards
**Target State:** Full glass design implementation

**Sections to Update:**
1. **Search Form Container:** Apply `.glass-container`
2. **Tab Navigation:** Maintain current styling (already good)
3. **Recommendation Cards:** Already using glass-like styling, ensure consistency
4. **Empty States:** Apply `.glass-container` to empty state messages

**Note:** This component already has good glass-like styling. Focus on ensuring consistency with the new utility classes.

### 6. Account Page Components

#### 6.1 Profile Section (`/src/components/account/ProfileSection.tsx`)

**Implementation:**
- Main container: `.glass-container`
- Form inputs: `.glass-input`
- Action buttons: Maintain current button styling

#### 6.2 Account Stats Section (`/src/components/account/AccountStatsSection.tsx`)

**Implementation:**
- Individual stat cards: `.glass-card-compact`
- Icon containers: Maintain gradient backgrounds
- Ensure number/text visibility

#### 6.3 CAD History Section (`/src/components/account/CADHistorySection.tsx`)

**Implementation:**
- Main container: `.glass-container`
- History item cards: `.glass-card-compact`
- Filter controls: `.glass-input` for dropdowns
- Pagination controls: Maintain current styling

### 7. Reports Manager Components

#### 7.1 ReportsManager (`/src/components/reports/ReportsManager.tsx`)

**Implementation:**
- Main container: `.glass-container`
- Individual report cards: `.glass-card`
- Filter panel: `.glass-container` with `.glass-input` controls
- Empty state: `.glass-container` with centered content

### 8. RFQ Components

#### 8.1 RFQ Form (`/src/components/rfq/RFQForm.tsx`)

**Implementation:**
- Form container: `.glass-container`
- Form inputs: `.glass-input`
- Product selection cards: `.glass-card-compact`

#### 8.2 RFQ Tracking (`/src/components/rfq/RFQTracking.tsx`)

**Implementation:**
- Main container: `.glass-container`
- Individual RFQ cards: `.glass-card`
- Status badges: Ensure visibility on glass background

## Data Models

### Glass Design Configuration

```typescript
interface GlassDesignConfig {
  containerType: 'glass-container' | 'glass-card' | 'glass-card-compact';
  enableHoverEffect: boolean;
  customBackground?: string;
  customBorder?: string;
  customShadow?: string;
}

interface ComponentGlassMapping {
  componentName: string;
  elementSelector: string;
  glassConfig: GlassDesignConfig;
}
```

### Theme Variables

```typescript
// CSS Custom Properties for Glass Design
:root {
  --glass-bg-primary: rgba(240, 247, 255, 0.88);
  --glass-bg-secondary: rgba(228, 239, 255, 0.82);
  --glass-border: rgba(147, 197, 253, 0.45);
  --glass-shadow-sm: 0 8px 32px 0 rgba(15, 23, 42, 0.25);
  --glass-shadow-lg: 0 34px 80px 0 rgba(15, 23, 42, 0.4);
  --glass-blur: blur(25px);
}
```

## Error Handling

### Browser Compatibility

**Issue:** `backdrop-filter` is not supported in all browsers
**Solution:** Provide fallback styling

```css
.glass-card {
  /* Fallback for browsers without backdrop-filter support */
  background: rgba(240, 247, 255, 0.95);
}

@supports (backdrop-filter: blur(25px)) {
  .glass-card {
    background: linear-gradient(
      145deg,
      rgba(240, 247, 255, 0.88) 0%,
      rgba(228, 239, 255, 0.82) 100%
    );
    backdrop-filter: blur(25px) saturate(180%);
  }
}
```

### Performance Considerations

**Issue:** Backdrop blur can impact performance on lower-end devices
**Solution:** Implement performance detection and fallback

```typescript
// Detect if device can handle backdrop-filter
const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');
const isLowEndDevice = navigator.hardwareConcurrency <= 2;

if (!supportsBackdropFilter || isLowEndDevice) {
  document.body.classList.add('no-backdrop-filter');
}
```

```css
.no-backdrop-filter .glass-card {
  backdrop-filter: none;
  background: rgba(240, 247, 255, 0.98);
}
```

### Text Readability

**Issue:** Glass backgrounds may reduce text contrast
**Solution:** Ensure minimum contrast ratios

```css
.glass-card {
  /* Ensure text has sufficient contrast */
  color: #0f172a; /* slate-900 */
}

.glass-card .text-secondary {
  color: #475569; /* slate-600 */
}

/* For light text on glass */
.glass-card-dark {
  color: #f8fafc; /* slate-50 */
}
```

## Testing Strategy

### Visual Regression Testing

**Approach:** Capture screenshots of components before and after glass design application

**Tools:** 
- Playwright for automated screenshot capture
- Percy or Chromatic for visual diff comparison

**Test Cases:**
1. Component renders with glass styling
2. Hover states apply correctly
3. Text remains readable
4. Responsive layouts maintain glass effect
5. Dark mode compatibility (if applicable)

### Browser Compatibility Testing

**Browsers to Test:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

**Test Scenarios:**
1. Glass effect renders correctly
2. Fallback styling works when backdrop-filter unsupported
3. Performance is acceptable on mobile devices
4. Touch interactions work correctly

### Accessibility Testing

**Focus Areas:**
1. **Color Contrast:** Ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
2. **Focus Indicators:** Ensure focus rings are visible on glass backgrounds
3. **Screen Reader Compatibility:** Glass styling should not affect screen reader functionality
4. **Keyboard Navigation:** All interactive elements remain accessible

**Tools:**
- axe DevTools for automated accessibility scanning
- Manual testing with screen readers (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation testing

### Performance Testing

**Metrics to Monitor:**
1. **First Contentful Paint (FCP):** Should not increase significantly
2. **Largest Contentful Paint (LCP):** Should remain under 2.5s
3. **Cumulative Layout Shift (CLS):** Should remain under 0.1
4. **Frame Rate:** Should maintain 60fps during animations

**Testing Approach:**
- Use Chrome DevTools Performance panel
- Test on low-end devices (throttled CPU/network)
- Monitor memory usage during extended sessions

### Unit Testing

**Component Tests:**
```typescript
describe('GlassCard Component', () => {
  it('applies glass-card class', () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    expect(container.firstChild).toHaveClass('glass-card');
  });

  it('applies hover effect on mouse enter', () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    fireEvent.mouseEnter(container.firstChild);
    // Assert hover styles are applied
  });

  it('renders children correctly', () => {
    const { getByText } = render(<GlassCard>Test Content</GlassCard>);
    expect(getByText('Test Content')).toBeInTheDocument();
  });
});
```

### Integration Testing

**User Flow Tests:**
1. Navigate to Home page → Verify AI Tools cards have glass design
2. Click CAD Generator → Verify interface uses glass containers
3. Upload file to CAD Analyzer → Verify upload area has glass styling
4. View CAD History → Verify history items use glass cards
5. Navigate to Account page → Verify all sections use glass design

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Add new CSS utility classes to `globals.css`
- Create documentation for glass design usage
- Set up visual regression testing infrastructure

### Phase 2: High Priority Components (Week 2)
- Home page AI Tools section
- Home page Product Categories section
- CAD Generator main interface
- CAD Analyzer main interface

### Phase 3: Medium Priority Components (Week 3)
- CAD History component
- Product Recommender (refinements)
- Account page sections

### Phase 4: Low Priority Components (Week 4)
- Reports Manager
- RFQ components
- Any remaining card components

### Phase 5: Testing & Refinement (Week 5)
- Comprehensive browser testing
- Performance optimization
- Accessibility audit
- Visual polish and adjustments

## Design Decisions and Rationales

### Decision 1: Reusable Utility Classes vs. Component-Specific Styles

**Decision:** Use reusable utility classes (`.glass-card`, `.glass-container`)

**Rationale:**
- Promotes consistency across the application
- Reduces CSS bundle size through class reuse
- Easier to maintain and update globally
- Follows Tailwind CSS utility-first philosophy

### Decision 2: Gradual Rollout vs. Big Bang Deployment

**Decision:** Gradual rollout by priority

**Rationale:**
- Reduces risk of introducing visual bugs
- Allows for iterative feedback and refinement
- Easier to test and validate each phase
- Minimizes impact on ongoing development

### Decision 3: Hover Effects on All Cards

**Decision:** Apply hover effects to all interactive glass cards

**Rationale:**
- Provides clear visual feedback for clickable elements
- Enhances perceived interactivity
- Consistent with existing product catalog behavior
- Improves user experience

### Decision 4: Performance Fallbacks

**Decision:** Implement fallback styling for low-end devices

**Rationale:**
- Ensures accessibility for all users
- Prevents performance degradation
- Maintains visual quality where supported
- Progressive enhancement approach

## Responsive Design Considerations

### Mobile Devices (< 768px)

**Adjustments:**
- Reduce blur intensity: `blur(15px)` instead of `blur(25px)`
- Simplify shadows: Use single shadow instead of layered
- Increase touch target sizes: Minimum 44x44px
- Reduce hover effects: Focus on tap states

```css
@media (max-width: 767px) {
  .glass-card {
    backdrop-filter: blur(15px) saturate(160%);
    box-shadow: 0 15px 30px 0 rgba(15, 23, 42, 0.2);
  }
  
  .glass-card:active {
    /* Tap state instead of hover */
    transform: scale(0.98);
  }
}
```

### Tablet Devices (768px - 1024px)

**Adjustments:**
- Maintain full glass effect
- Optimize card grid layouts
- Ensure touch-friendly spacing

### Desktop (> 1024px)

**Adjustments:**
- Full glass effect with all enhancements
- Enhanced hover animations
- Larger card sizes where appropriate

## Accessibility Enhancements

### Focus Indicators

```css
.glass-card:focus-visible {
  outline: 3px solid rgba(59, 130, 246, 0.8);
  outline-offset: 2px;
}
```

### High Contrast Mode Support

```css
@media (prefers-contrast: high) {
  .glass-card {
    background: rgba(255, 255, 255, 0.98);
    border: 2px solid rgba(0, 0, 0, 0.8);
  }
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .glass-card {
    transition: none;
  }
  
  .glass-card:hover {
    transform: none;
  }
}
```

## Documentation

### Developer Guide

**Location:** `/documentation/GLASS_DESIGN_GUIDE.md`

**Contents:**
1. Overview of glass design system
2. Available utility classes and their usage
3. Code examples for common patterns
4. Best practices and guidelines
5. Troubleshooting common issues

### Component Examples

**Location:** `/documentation/examples/glass-components.tsx`

**Contents:**
- Example implementations for each component type
- Before/after code comparisons
- Interactive Storybook stories

## Maintenance Plan

### Regular Reviews

- **Monthly:** Review new components for glass design application
- **Quarterly:** Audit existing implementations for consistency
- **Annually:** Evaluate design system evolution and updates

### Version Control

- Document all changes to glass design classes
- Maintain changelog for design system updates
- Use semantic versioning for major design changes

### Performance Monitoring

- Set up performance budgets for pages with glass effects
- Monitor Core Web Vitals metrics
- Alert on performance regressions
