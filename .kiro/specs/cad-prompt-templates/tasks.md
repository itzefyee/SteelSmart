# Implementation Plan

- [x] 1. Create one-time setup script to fetch ML prompt templates






  - Create `scripts/fetch-ml-prompts.ts` that calls Zoo Dev API `ml.list_ml_prompts({type: 'text_to_cad'})`
  - Transform API response to MLPromptTemplate interface format
  - Write formatted TypeScript data to `src/data/sample-data.ts`
  - Add error handling for API failures, rate limits, and file write errors
  - Log success/failure messages to console
  - _Requirements: 1.1, 3.1, 5.1, 5.2, 5.3, 5.4_

- [x] 2. Run script and capture ML prompt templates





  - Execute `npx tsx scripts/fetch-ml-prompts.ts` to fetch templates
  - Review fetched templates for quality and completeness
  - Manually edit templates if needed for clarity
  - Commit the updated `sample-data.ts` file to repository
  - _Requirements: 1.1, 3.3_

- [x] 3. Create PromptTemplateSelector component





  - Create `src/components/cad/PromptTemplateSelector.tsx` component
  - Implement grid layout for template cards (responsive: 1 col mobile, 2-3 cols desktop)
  - Display template title, description, category badge, and tags
  - Add hover effects and selection highlighting with primary color (#2563eb)
  - Implement click handler to select template
  - Add empty state UI when no templates available
  - Style with Tailwind CSS consistent with existing design system
  - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 2.4_

- [x] 4. Update CADGenerator component to integrate templates
  - Import `mlPromptTemplates` from `@/data/sample-data`
  - Add state for input mode toggle (`'templates' | 'custom'`)
  - Add state for selected ML template
  - Create mode toggle UI (buttons or tabs) in "Text Input Generation" tab
  - Integrate PromptTemplateSelector component in templates mode
  - Replace hardcoded suggested prompts with templates from `mlPromptTemplates`
  - When template is selected, populate the text input with template prompt
  - Preserve existing chat-like interface for custom input mode
  - Ensure custom input mode remains the default to preserve existing UX
  - _Requirements: 1.3, 2.1, 2.4, 4.1, 4.2, 4.3, 4.4_

- [x] 5. Add keyboard navigation and accessibility features
  - Implement keyboard navigation for template cards (Tab, Enter, Space)
  - Add proper ARIA labels to template cards and interactive elements
  - Ensure focus indicators are visible on all interactive elements
  - Add ARIA live regions for selection announcements
  - Verify color contrast meets WCAG AA standards
  - Test with screen reader
  - _Requirements: 2.1, 2.2_

- [x] 6. Verify CAD generation works with template prompts
  - Test selecting a template and generating a CAD model
  - Verify template prompt is passed correctly to generation API
  - Confirm generated models are saved to history with template metadata
  - Test switching between template and custom input modes
  - Verify custom input mode still works as before
  - _Requirements: 1.3, 4.1, 4.2, 4.3, 4.4_
