# Design Document

## Overview

This feature replaces the current static template selection and manual text input in the CAD Generator with pre-built, best-practice prompt templates from Zoo Dev's ML prompt library. The implementation will make a one-time API call to `ml.list_ml_prompts({type: 'text_to_cad'})` to capture the templates, then hardcode them into the application as static data. This approach ensures consistent availability without requiring repeated API calls.

The design leverages the existing Zoo Dev API integration for the initial data capture, then stores the templates as static data similar to the current `cadTemplates` in `sample-data.ts`.

## Architecture

### High-Level Flow

```
[One-Time Setup]
Developer Runs Script → Fetch ML Prompt Templates (API) → Save to sample-data.ts

[Runtime Flow]
User Opens CAD Generator
    ↓
Component Mounts → Load Templates from Static Data
    ↓
Display Templates in UI (Grid/List)
    ↓
User Selects Template OR Enters Custom Text
    ↓
Generate CAD Model (Existing Flow)
```

### Component Structure

```
CADGenerator (existing)
    ├── Import mlPromptTemplates from sample-data.ts
    ├── PromptTemplateSelector (new component)
    │   ├── Template grid/list display
    │   ├── Template preview cards
    │   └── Selection handling
    └── Existing generation logic (unchanged)
```

## Components and Interfaces

### 1. One-Time Setup Script: `fetch-ml-prompts.ts`

**Location:** `scripts/fetch-ml-prompts.ts`

**Purpose:** One-time script to fetch ML prompt templates from Zoo Dev API and save them to static data file.

**Usage:**
```bash
npx tsx scripts/fetch-ml-prompts.ts
```

**Implementation Details:**
- Calls `ml.list_ml_prompts({type: 'text_to_cad'})` from `@kittycad/lib`
- Transforms Zoo Dev API response to our interface format
- Writes formatted TypeScript data to `src/data/sample-data.ts`
- Appends to existing file without overwriting other data
- Handles API errors with clear error messages
- Logs success/failure to console

### 2. Data Model: `mlPromptTemplates`

**Location:** `src/data/sample-data.ts` (existing file, add new export)

**Interface:**
```typescript
interface MLPromptTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category?: string;
  tags?: string[];
  example_output?: string;
}

export const mlPromptTemplates: MLPromptTemplate[] = [
  // Data populated by fetch-ml-prompts.ts script
];
```

**Data Structure:**
- Array of template objects
- Each template contains all necessary display and generation data
- No runtime API calls needed
- Can be manually edited if needed

### 3. Component: `PromptTemplateSelector`

**Location:** `src/components/cad/PromptTemplateSelector.tsx`

**Purpose:** Display ML prompt templates in a browsable, selectable interface.

**Props:**
```typescript
interface PromptTemplateSelectorProps {
  templates: MLPromptTemplate[];
  selectedTemplateId: string | null;
  onSelectTemplate: (template: MLPromptTemplate) => void;
  isLoading?: boolean;
}
```

**UI Layout:**
- Grid layout (2-3 columns on desktop, 1 on mobile)
- Each template card shows:
  - Title (prominent)
  - Description (2-3 lines)
  - Category badge (if available)
  - Tags (if available)
  - Visual selection indicator
- Hover effects for interactivity
- Selected state with primary color border
- Loading skeleton states
- Empty state when no templates available

**Styling:**
- Consistent with existing design system (Tailwind CSS)
- Primary color: `#2563eb`
- Card-based layout with rounded corners
- Responsive grid using `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### 4. Modified Component: `CADGenerator`

**Location:** `src/components/cad/CADGenerator.tsx` (existing)

**Changes:**
1. Import `mlPromptTemplates` from `@/data/sample-data`
2. Replace suggested prompts array with templates from `mlPromptTemplates`
3. Add `PromptTemplateSelector` component to "Text Input Generation" tab
4. Maintain existing template generation logic
5. Add toggle between "Browse Templates" and "Custom Input" modes
6. Preserve existing chat-like interface for custom input

**New State:**
```typescript
const [inputMode, setInputMode] = useState<'templates' | 'custom'>('custom'); // Default to custom to preserve existing UX
const [selectedMLTemplate, setSelectedMLTemplate] = useState<MLPromptTemplate | null>(null);
```

**UI Flow:**
```
Text Input Generation Tab
    ├── Mode Toggle (Templates / Custom Input)
    ├── [If Templates Mode]
    │   ├── PromptTemplateSelector
    │   └── Selected template preview
    ├── [If Custom Input Mode]
    │   └── Existing chat interface
    └── Generate Button
```

## Data Models

### MLPromptTemplate (Client-side)

```typescript
interface MLPromptTemplate {
  id: string;                    // Unique identifier
  title: string;                 // Display name
  description: string;           // Detailed description
  prompt: string;                // The actual prompt text
  category?: string;             // Optional category (e.g., "structural", "mechanical")
  tags?: string[];              // Optional tags for filtering
  example_output?: string;       // Optional example of what this generates
}
```

### Zoo Dev API Response Mapping

The Zoo Dev API `ml.list_ml_prompts()` returns a structure that needs to be mapped to our interface. Based on typical ML prompt APIs, we expect:

```typescript
// Zoo Dev API Response (expected structure)
interface ZooMLPromptResponse {
  id: string;
  name: string;
  description: string;
  template: string;
  metadata?: {
    category?: string;
    tags?: string[];
    example?: string;
  };
}

// Mapping function
function mapZooPromptToTemplate(zooPrompt: ZooMLPromptResponse): MLPromptTemplate {
  return {
    id: zooPrompt.id,
    title: zooPrompt.name,
    description: zooPrompt.description,
    prompt: zooPrompt.template,
    category: zooPrompt.metadata?.category,
    tags: zooPrompt.metadata?.tags,
    example_output: zooPrompt.metadata?.example
  };
}
```

## Error Handling

### Script Errors (One-Time Setup)

**Scenario 1: Zoo Dev API Unavailable**
- Script logs clear error message
- Provides instructions to retry later
- Does not modify existing data files
- Exit with error code

**Scenario 2: Rate Limit Exceeded**
- Script logs rate limit message
- Suggests waiting period
- Exit with error code

**Scenario 3: Authentication Error**
- Script logs authentication failure
- Reminds user to check ZOO_API_TOKEN
- Exit with error code

**Scenario 4: File Write Error**
- Script logs file system error
- Checks file permissions
- Exit with error code

### Runtime Errors (Minimal)

Since templates are static data, runtime errors are minimal:
- If `mlPromptTemplates` is empty, show empty state
- If template data is malformed, skip invalid entries
- Always allow fallback to custom input mode

### Empty State UI

```typescript
// Empty state in PromptTemplateSelector
{templates.length === 0 && (
  <div className="text-center p-8">
    <p className="text-gray-600 mb-4">No templates available</p>
    <button onClick={() => setInputMode('custom')}>
      Use Custom Input Instead
    </button>
  </div>
)}
```

## Testing Strategy

### Unit Tests

**Script Testing (`fetch-ml-prompts.test.ts`):**
- Test API response parsing
- Test data transformation
- Test file writing logic
- Mock Zoo Dev API responses
- Test error handling

**Component Testing (`PromptTemplateSelector.test.tsx`):**
- Test template rendering with static data
- Test selection behavior
- Test empty states
- Test responsive layout
- Test keyboard navigation

### Integration Tests

**End-to-End Flow:**
1. Component mounts → Templates display from static data
2. User selects template → Prompt populates
3. User generates CAD → Model created
4. Verify template data persists in history

**Mode Switching Flow:**
1. User toggles to template mode → Templates display
2. User selects template → Prompt populates
3. User switches to custom mode → Can edit prompt
4. User generates → Model created

### Manual Testing Checklist

- [ ] Script successfully fetches templates
- [ ] Script writes valid TypeScript to sample-data.ts
- [ ] Templates display in grid layout
- [ ] Template selection highlights correctly
- [ ] Selected template populates input
- [ ] Custom input mode toggle works
- [ ] Empty state displays when no templates
- [ ] Responsive layout on mobile
- [ ] Generation works with template prompts
- [ ] Generation works with custom input
- [ ] History saves template-generated models

## Performance Considerations

### Static Data Benefits

**No Runtime API Calls:**
- Templates load instantly from JavaScript bundle
- No network latency
- No API rate limits to worry about
- No loading states needed

**Bundle Size:**
- Expect 10-50 templates in static data
- Each template ~500 bytes
- Total addition to bundle: ~5-25KB
- Negligible impact on page load

### Optimization Techniques

1. **Code Splitting:** Templates only loaded when CAD Generator page is accessed
2. **Memoization:** Use `useMemo` for filtered/sorted templates if search is added
3. **Lazy Rendering:** Render template cards as user scrolls (if many templates)

## Migration Strategy

### Phase 1: Fetch and Store Templates (One-Time)
- Run `fetch-ml-prompts.ts` script to get templates from Zoo Dev API
- Review fetched templates for quality
- Manually edit if needed
- Commit to repository

### Phase 2: Add New UI Components (Non-Breaking)
- Create PromptTemplateSelector component
- Add mode toggle to CADGenerator
- Test in isolation
- Keep existing functionality intact

### Phase 3: Replace Suggested Prompts
- Replace hardcoded suggested prompts with ML templates
- Update "Text Input Generation" tab UI
- Maintain custom input as default mode
- Keep existing template system in "Template Selection" tab

### Phase 4: Optional Cleanup
- Consider removing old "Template Selection" tab if ML prompts are sufficient
- Or keep both for different use cases (templates vs prompts)
- Monitor user feedback

## Security Considerations

### API Key Protection (Script Only)
- Zoo Dev API token stored in environment variables
- Only used during one-time script execution
- Never exposed to client
- Not needed at runtime

### Input Validation
- Sanitize template prompts before storing in static data
- Validate template structure from API response
- Prevent XSS through proper escaping in React components
- Review fetched templates manually before committing

### Static Data Safety
- Templates are code-reviewed as part of repository
- No runtime injection risks
- Can be manually audited
- Version controlled with git

## Accessibility

### Keyboard Navigation
- Tab through template cards
- Enter/Space to select template
- Arrow keys for grid navigation
- Focus indicators on all interactive elements

### Screen Reader Support
- Proper ARIA labels on template cards
- Announce selection changes
- Describe loading states
- Error messages in ARIA live regions

### Visual Accessibility
- Sufficient color contrast (WCAG AA)
- Focus indicators visible
- Text readable at 200% zoom
- No color-only indicators

## Future Enhancements

### Phase 2 Features (Not in Initial Implementation)
1. **Search and Filter:** Search templates by keyword, filter by category/tags
2. **Favorites:** Allow users to save favorite templates to localStorage
3. **Custom Templates:** Let users create and save their own templates
4. **Template Preview:** Show example outputs for each template (if provided by API)
5. **Template History:** Track most-used templates per user
6. **Template Suggestions:** Show recently used or popular templates first

### Template Updates
1. **Periodic Refresh:** Re-run script periodically to get updated templates from Zoo Dev
2. **Version Tracking:** Track which version of templates is in use
3. **Diff Tool:** Script to compare old vs new templates before updating
4. **Automated Updates:** GitHub Action to check for new templates monthly

### Technical Improvements
1. **Dynamic Loading:** Load templates from JSON file instead of TypeScript for easier updates
2. **Analytics:** Track template usage and success rates
3. **A/B Testing:** Test different template presentations
