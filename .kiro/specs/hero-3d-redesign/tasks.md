# Implementation Plan

- [x] 1. Set up dependencies and configuration





  - Install required npm packages: @react-three/fiber, @react-three/drei, three, framer-motion, and their TypeScript types
  - Update tailwind.config.js with blueprint theme colors, gradients, shadows, and background patterns
  - _Requirements: 1.5, 2.4, 4.1, 4.2_
-

- [x] 2. Create 3D model viewer component



  - [x] 2.1 Implement Model3DViewer component with Three.js scene setup


    - Create Model3DViewer.tsx with React Three Fiber Canvas component
    - Configure camera position, FOV, and lighting (ambient + directional with blue tint)
    - Implement GLTF model loader with error handling and fallback geometry
    - Add OrbitControls with auto-rotate enabled and pan disabled
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Add wireframe/blueprint rendering style


    - Apply blue wireframe material (#0066CC edges, transparent faces)
    - Configure edge thickness and blueprint aesthetic
    - Add cyan accent lighting (#00D4FF) for technical drawing look
    - _Requirements: 2.4_



  - [ ] 2.3 Implement specification overlay display
    - Create specification info panel component with semi-transparent white background
    - Position overlay at bottom-left of 3D viewer
    - Display dimensions, material, holes, and weight with blue values and gray labels
    - Make overlay responsive (hide on very small screens < 375px)
    - _Requirements: 2.5, 4.3_

  - [ ]* 2.4 Add error handling and loading states
    - Implement error boundary for 3D rendering failures
    - Create fallback wireframe cube component for model load errors
    - Add loading spinner with blueprint styling during model load
    - Display user-friendly error messages
    - _Requirements: 2.1_

- [x] 3. Create animated text prompt component




  - [x] 3.1 Implement AnimatedTextPrompt component with typing animation


    - Create AnimatedTextPrompt.tsx with Framer Motion animations
    - Implement character-by-character typing effect (50ms per character)
    - Add cursor blink animation using CSS or Framer Motion
    - Create prompt cycling logic: type → pause (3s) → delete (30ms per char) → pause (500ms) → repeat
    - _Requirements: 1.2_


  - [x] 3.2 Add accessibility support for reduced motion

    - Implement useReducedMotion hook to detect prefers-reduced-motion media query
    - Disable typing animation when reduced motion is preferred
    - Show static text instead of animation for accessibility
    - Add aria-live="polite" for screen reader announcements
    - _Requirements: 5.1_

  - [x] 3.3 Configure example prompts array


    - Define array of 3-5 example CAD generation prompts
    - Include diverse examples: brake rotor, mounting bracket, heat sink, etc.
    - Ensure prompts demonstrate platform capabilities clearly
    - _Requirements: 1.2_




- [x] 4. Create hero call-to-action component



  - [ ] 4.1 Implement HeroCallToAction button component
    - Create HeroCallToAction.tsx with gradient blue button styling
    - Apply linear gradient background (#0066CC to #00D4FF)
    - Add "START DESIGNING" label with arrow or sparkle icon

    - Configure navigation to /cad-generator route
    - _Requirements: 1.4_


  - [ ] 4.2 Add hover and focus states
    - Implement hover effect: translateY(-2px) with stronger blue-glow shadow


    - Add visible focus indicator with blue outline for keyboard navigation
    - Ensure button is keyboard accessible (proper tabindex and enter/space handlers)
    - _Requirements: 5.4_

- [x] 5. Create main HeroBlueprint container component


  - [ ] 5.1 Implement HeroBlueprint layout component
    - Create HeroBlueprint.tsx as main container component
    - Apply white to light gray gradient background (#FFFFFF → #F9FAFB)
    - Add blueprint grid pattern overlay using radial-gradient with blue dots at 5% opacity
    - Configure responsive padding (py-16 mobile, py-24 desktop)

    - _Requirements: 1.1, 1.5_

  - [ ] 5.2 Implement responsive layout grid
    - Create two-column grid layout using Tailwind CSS Grid
    - Left column: AnimatedTextPrompt and HeroCallToAction (40% width on desktop)
    - Right column: Model3DViewer (60% width on desktop)

    - Stack vertically on mobile (< 768px): text prompt on top, 3D viewer below
    - _Requirements: 4.1, 4.2_

  - [ ] 5.3 Add heading and descriptive text
    - Display "Discover Text-to-CAD" heading with gradient text effect






    - Add subheading explaining the AI-powered capability
    - Style with blueprint theme colors (blue gradient for heading, gray for body text)
    - Ensure responsive font sizes (text-4xl mobile, text-6xl desktop)
    - _Requirements: 1.3, 4.4_



  - [ ] 5.4 Integrate all child components
    - Import and render AnimatedTextPrompt component
    - Import and render Model3DViewer component with sample model path
    - Import and render HeroCallToAction component


    - Pass appropriate props to each component (prompts, model path, specifications)
    - _Requirements: 1.1_

- [ ] 6. Update homepage to use new hero section

  - [ ] 6.1 Replace existing Hero component with HeroBlueprint
    - Update page.tsx to import HeroBlueprint instead of Hero
    - Remove or comment out old Hero component import
    - Render HeroBlueprint as first section after Header
    - _Requirements: 3.1_

  - [ ] 6.2 Reposition existing sections below new hero
    - Move "AI-Powered Tools" section to appear after HeroBlueprint
    - Move "Featured Products" section to appear after AI-Powered Tools
    - Ensure CategoryShowcase and other sections maintain their order
    - Verify all section spacing and margins are consistent
    - _Requirements: 3.2, 3.3_

  - [ ] 6.3 Verify navigation and internal links
    - Test all navigation links still work correctly
    - Verify CTA button navigates to /cad-generator
    - Check that existing section links and anchors are not broken
    - Test scroll behavior and page flow
    - _Requirements: 3.5_

- [x] 7. Add sample 3D model asset
  - [x] 7.1 Prepare and optimize 3D model file
    - Obtain or create a sample brake rotor or mounting bracket GLB model
    - Optimize model to < 10,000 triangles and < 500KB file size
    - Apply Draco compression if needed for smaller file size
    - Test model loads correctly in Three.js viewer
    - _Requirements: 2.1_

  - [x] 7.2 Add model to public assets
    - Create /public/models directory if it doesn't exist
    - Copy optimized GLB file to /public/models/sample-part.glb
    - Update Model3DViewer component to reference correct model path
    - _Requirements: 2.1_

- [x] 8. Implement accessibility features



  - [x] 8.1 Add semantic HTML and ARIA labels


    - Use semantic HTML5 elements (section, heading hierarchy)
    - Add aria-label to 3D viewer describing the displayed model
    - Ensure proper heading hierarchy (h1 for main heading)
    - Add aria-live region for animated text announcements
    - _Requirements: 5.2, 5.5_

  - [x] 8.2 Ensure keyboard navigation


    - Test tab navigation through all interactive elements
    - Verify focus indicators are visible on all focusable elements
    - Ensure CTA button is keyboard accessible (enter/space to activate)
    - Test 3D viewer controls work with keyboard (if applicable)
    - _Requirements: 5.4_

  - [x] 8.3 Verify color contrast ratios


    - Check text-to-background contrast meets WCAG AA standards (4.5:1 minimum)
    - Test heading contrast (white/blue gradient on light background)
    - Verify button text contrast (white on blue gradient)
    - Test specification overlay text contrast
    - _Requirements: 5.3_




- [x] 9. Optimize performance



  - [x] 9.1 Implement lazy loading for 3D model

    - Use dynamic import for Model3DViewer component


    - Load 3D model only when hero section is in viewport (Intersection Observer)
    - Show loading placeholder until model is ready
    - _Requirements: 2.1_



  - [x] 9.2 Add code splitting for Three.js

    - Configure Next.js dynamic imports for @react-three/fiber components
    - Split Three.js bundle from main JavaScript bundle
    - Verify bundle size impact is < 100KB additional
    - _Requirements: 2.1_

  - [x] 9.3 Optimize animation performance

    - Use requestAnimationFrame for smooth 60fps animations
    - Memoize 3D scene components to prevent unnecessary re-renders
    - Throttle auto-rotation updates if frame rate drops below 30fps
    - Test performance on low-end devices
    - _Requirements: 2.2, 2.3_

- [ ] 10. Test responsive behavior
  - [ ] 10.1 Test mobile layout (< 768px)
    - Verify components stack vertically on mobile
    - Check 3D viewer height is appropriate (50vh on mobile)
    - Test text sizes are readable without zooming
    - Verify touch controls work for 3D model rotation
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 10.2 Test tablet layout (768px - 1024px)
    - Verify side-by-side layout appears correctly
    - Check spacing and proportions are balanced
    - Test 3D viewer size is appropriate for tablet screens
    - _Requirements: 4.2_

  - [ ] 10.3 Test desktop layout (> 1024px)
    - Verify full side-by-side layout with proper column widths
    - Check 3D viewer displays at optimal size (70vh)
    - Test specification overlay positioning
    - Verify all animations perform smoothly
    - _Requirements: 4.2, 4.5_

  - [ ] 10.4 Test edge cases and breakpoints
    - Test at 320px width (smallest mobile)
    - Test at 1920px width (large desktop)
    - Verify no horizontal scrolling at any breakpoint
    - Check for layout shifts during page load
    - _Requirements: 4.5_
