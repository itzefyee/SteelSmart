# Component Documentation

This document provides an overview of the main components in the SteelSmart application.

## 📑 Table of Contents

- [UI Components](#ui-components)
- [Feature Components](#feature-components)
- [Custom Hooks](#custom-hooks)
- [Utilities](#utilities)

---

## 🎨 UI Components

Base UI components located in `src/components/ui/`.

### Button

Reusable button component with consistent styling.

```tsx
import Button from '@/components/ui/Button';

<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>
```

**Props:**
- `variant?: 'primary' | 'secondary' | 'danger'` - Button style
- `size?: 'sm' | 'md' | 'lg'` - Button size
- `disabled?: boolean` - Disabled state
- `onClick?: () => void` - Click handler

### Input

Styled input field with error handling.

```tsx
import Input from '@/components/ui/Input';

<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={error}
/>
```

**Props:**
- `label?: string` - Input label
- `type?: string` - Input type
- `value: string` - Input value
- `onChange: (e) => void` - Change handler
- `error?: string` - Error message

### Modal

Modal dialog component.

```tsx
import Modal from '@/components/ui/Modal';

<Modal isOpen={isOpen} onClose={handleClose} title="Modal Title">
  <p>Modal content here</p>
</Modal>
```

**Props:**
- `isOpen: boolean` - Modal visibility
- `onClose: () => void` - Close handler
- `title?: string` - Modal title
- `children: ReactNode` - Modal content

### LoadingSpinner

Loading indicator component.

```tsx
import LoadingSpinner from '@/components/ui/LoadingSpinner';

<LoadingSpinner size="lg" />
```

**Props:**
- `size?: 'sm' | 'md' | 'lg'` - Spinner size

---

## 🔧 Feature Components

Main feature components located in `src/components/`.

### CADAnalyzerFull

Full-featured CAD analysis component with AI-powered analysis using Google Gemini.

**Location:** `src/components/CADAnalyzerFull.tsx`

**Features:**
- Upload CAD drawings (PDF, PNG, JPG, STEP, STL)
- AI-powered dimension extraction
- Material identification
- Tolerance analysis
- Product recommendations

**Usage:**
```tsx
import CADAnalyzerFull from '@/components/CADAnalyzerFull';

<CADAnalyzerFull />
```

**Key Dependencies:**
- Google Gemini API
- File upload utilities
- Product recommendation engine

### CADGenerator

Text-to-CAD generation component using Zoo Dev API.

**Location:** `src/components/CADGenerator.tsx` (1012 LOC)

**Features:**
- Natural language to CAD conversion
- Multiple output formats (STEP, STL, OBJ, DXF)
- Real-time generation progress
- Download management
- Generation history

**Usage:**
```tsx
import CADGenerator from '@/components/CADGenerator';

<CADGenerator />
```

**API Endpoint:** `/api/generate-cad`

### CADPreview3D

3D model viewer using Three.js and OpenCascade.js.

**Location:** `src/components/CADPreview3D.tsx` (660 LOC)

**Features:**
- Interactive 3D visualization
- Support for STEP, STL, OBJ, glTF
- Rotation, zoom, pan controls
- Bounding box display
- Face/edge analysis

**Usage:**
```tsx
import CADPreview3D from '@/components/CADPreview3D';

<CADPreview3D fileUrl="/path/to/model.step" />
```

**Props:**
- `fileUrl: string` - URL to CAD file
- `format?: 'step' | 'stl' | 'obj' | 'gltf'` - File format

### ProductCard

Product display card component.

**Location:** `src/components/ProductCard.tsx`

**Features:**
- Product image display
- Price formatting
- Stock status indicator
- Quick view button

**Usage:**
```tsx
import ProductCard from '@/components/ProductCard';

<ProductCard product={product} />
```

**Props:**
- `product: Product` - Product object

### RFQForm

Multi-step Request for Quote form.

**Location:** `src/components/RFQForm.tsx` (784 LOC)

**Features:**
- 5-step form wizard
- Real-time validation
- File upload for technical drawings
- Email submission

**Usage:**
```tsx
import RFQForm from '@/components/RFQForm';

<RFQForm />
```

**API Endpoint:** `/api/submit-rfq`

### ProductRecommender

AI-powered product recommendation engine.

**Location:** `src/components/ProductRecommender.tsx` (381 LOC)

**Features:**
- Specification-based matching
- Confidence scoring
- Compatibility analysis
- Multiple recommendations

**Usage:**
```tsx
import ProductRecommender from '@/components/ProductRecommender';

<ProductRecommender specifications={specs} />
```

### CADHistory

Display generation history with metadata.

**Location:** `src/components/CADHistory.tsx` (582 LOC)

**Features:**
- localStorage persistence
- Downloadable history
- Search and filter
- Delete functionality

**Usage:**
```tsx
import CADHistory from '@/components/CADHistory';

<CADHistory />
```

---

## 🪝 Custom Hooks

Reusable React hooks located in `src/hooks/`.

### useFileUpload

Handle file uploads with validation and preview.

**Location:** `src/hooks/useFileUpload.ts`

**Usage:**
```tsx
import { useFileUpload } from '@/hooks';

const {
  file,
  preview,
  error,
  isUploading,
  handleFileSelect,
  clearFile,
} = useFileUpload({
  allowedTypes: ['application/pdf', 'image/png'],
  maxSizeInMB: 10,
  onSuccess: (file) => console.log('Uploaded:', file),
  onError: (error) => console.error('Error:', error),
});
```

**Returns:**
- `file: File | null` - Selected file
- `preview: string | null` - Image preview URL
- `error: string | null` - Error message
- `isUploading: boolean` - Upload state
- `handleFileSelect: (file: File) => void` - File selection handler
- `clearFile: () => void` - Clear file handler

### useCADGeneration

Generate CAD models from text descriptions.

**Location:** `src/hooks/useCADGeneration.ts`

**Usage:**
```tsx
import { useCADGeneration } from '@/hooks';

const {
  isGenerating,
  progress,
  error,
  result,
  generateCAD,
  reset,
} = useCADGeneration({
  onSuccess: (result) => console.log('Generated:', result),
  onError: (error) => console.error('Error:', error),
  onProgress: (status) => console.log('Progress:', status),
});

// Generate CAD
await generateCAD('Create a mounting bracket', 'step');
```

**Returns:**
- `isGenerating: boolean` - Generation state
- `progress: string` - Progress message
- `error: string | null` - Error message
- `result: CADGenerationResult | null` - Generation result
- `generateCAD: (prompt, format) => Promise<CADGenerationResult>` - Generate function
- `reset: () => void` - Reset state

### useCADAnalysis

Analyze CAD drawings with AI.

**Location:** `src/hooks/useCADAnalysis.ts`

**Usage:**
```tsx
import { useCADAnalysis } from '@/hooks';

const {
  isAnalyzing,
  error,
  analysis,
  analyzeDrawing,
  reset,
} = useCADAnalysis({
  onSuccess: (analysis) => console.log('Analysis:', analysis),
  onError: (error) => console.error('Error:', error),
});

// Analyze drawing
await analyzeDrawing(file);
```

**Returns:**
- `isAnalyzing: boolean` - Analysis state
- `error: string | null` - Error message
- `analysis: CADAnalysisResult | null` - Analysis result
- `analyzeDrawing: (file: File) => Promise<CADAnalysisResult>` - Analyze function
- `reset: () => void` - Reset state

---

## 🛠️ Utilities

Utility functions located in `src/lib/`.

### Logger

Production-safe logging utility.

**Location:** `src/lib/logger.ts`

**Usage:**
```tsx
import { logger } from '@/lib/logger';

logger.debug('Debug info', { data }); // Development only
logger.info('Information message');   // Development only
logger.warn('Warning message');       // Always logged
logger.error('Error occurred', error); // Always logged
```

**Features:**
- Environment-aware logging
- Development vs production modes
- Structured log format
- Timestamp inclusion

### Utils

General utility functions.

**Location:** `src/lib/utils.ts`

**Key Functions:**

#### formatPrice
```tsx
import { formatPrice } from '@/lib/utils';
formatPrice(1000); // "$1,000.00"
```

#### validateEmail
```tsx
import { validateEmail } from '@/lib/utils';
validateEmail('user@example.com'); // true
```

#### formatFileSize
```tsx
import { formatFileSize } from '@/lib/utils';
formatFileSize(1024 * 1024); // "1 MB"
```

#### isValidFileType
```tsx
import { isValidFileType } from '@/lib/utils';
isValidFileType(file, ['application/pdf']); // boolean
```

#### isValidFileSize
```tsx
import { isValidFileSize } from '@/lib/utils';
isValidFileSize(file, 10); // Check if file is under 10MB
```

### Gemini Client

Google Gemini API integration.

**Location:** `src/lib/gemini-client.ts`

**Usage:**
```tsx
import { GeminiClient } from '@/lib/gemini-client';

const client = new GeminiClient(apiKey);
const analysis = await client.analyzeDrawing(imageData);
```

### Zoo Client

Zoo Dev API integration.

**Location:** `src/lib/zoo-client.ts`

**Usage:**
```tsx
import { ZooClient } from '@/lib/zoo-client';

const client = new ZooClient(apiKey);
const result = await client.generateCAD(prompt, format);
```

### CAD Parser

OpenCascade.js CAD file parsing.

**Location:** `src/lib/cad-parser.ts`

**Usage:**
```tsx
import { CADParser } from '@/lib/cad-parser';

const parser = new CADParser();
await parser.initialize();
const modelData = await parser.parseSTEP(fileBuffer);
```

---

## 🎯 Component Best Practices

### 1. Keep Components Small
Break large components (>300 LOC) into smaller, focused components.

### 2. Use Custom Hooks
Extract reusable logic into custom hooks for better code reuse.

### 3. Type Safety
Always define TypeScript interfaces for props and state.

### 4. Error Handling
Implement proper error handling with user-friendly messages.

### 5. Loading States
Show loading indicators for async operations.

### 6. Accessibility
Use semantic HTML and ARIA attributes where needed.

### 7. Testing
Write tests for all components with >50 LOC.

---

## 📚 Additional Resources

- [React Component Patterns](https://react.dev/learn)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Tailwind CSS Components](https://tailwindui.com/)

---

Last Updated: 2025-11-14
