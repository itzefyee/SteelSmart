# Contributing to SteelSmart

Thank you for your interest in contributing to SteelSmart! This guide will help you get started with development.

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## 🚀 Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd steal_smart
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:
- `GEMINI_API_KEY` - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- `ZOO_DEV_API_KEY` - Get from [Zoo.dev](https://zoo.dev/)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
steal_smart/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── api/               # API routes
│   │   ├── (pages)/           # Route pages
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   └── [features]/       # Feature-specific components
│   ├── hooks/                # Custom React hooks
│   │   ├── useFileUpload.ts
│   │   ├── useCADGeneration.ts
│   │   └── useCADAnalysis.ts
│   ├── lib/                  # Utility libraries
│   │   ├── logger.ts         # Production-safe logging
│   │   ├── utils.ts          # General utilities
│   │   ├── gemini-client.ts  # Google Gemini API
│   │   ├── zoo-client.ts     # Zoo Dev API
│   │   └── cad-parser.ts     # CAD file parsing
│   ├── types/                # TypeScript definitions
│   ├── data/                 # Static data (products, categories)
│   └── __tests__/            # Test files
├── public/                   # Static assets
├── documentation/            # Project documentation
└── [config files]            # Configuration files
```

## 💻 Coding Standards

### TypeScript

- Use TypeScript for all new files
- Enable strict mode
- Define interfaces for all data structures
- Use type inference where possible

```typescript
// Good
interface Product {
  id: string;
  name: string;
  price: number;
}

// Avoid
const product: any = { ... };
```

### React Components

- Use functional components with hooks
- Use `'use client'` directive for client components
- Extract reusable logic into custom hooks
- Keep components focused and small (<300 LOC)

```typescript
'use client';

import { useState } from 'react';

export default function MyComponent() {
  const [state, setState] = useState<string>('');

  return <div>{state}</div>;
}
```

### Custom Hooks

We provide several custom hooks to simplify common operations:

- `useFileUpload` - Handle file uploads with validation
- `useCADGeneration` - Generate CAD models from text
- `useCADAnalysis` - Analyze CAD drawings with AI

```typescript
import { useFileUpload } from '@/hooks';

const { file, error, handleFileSelect } = useFileUpload({
  allowedTypes: ['application/pdf'],
  maxSizeInMB: 10,
  onSuccess: (file) => console.log('File uploaded:', file),
});
```

### Logging

Use the logger utility instead of `console.log` for production code:

```typescript
import { logger } from '@/lib/logger';

// Development only
logger.debug('Debug information', { data });

// Production safe
logger.info('User action completed');
logger.warn('Warning condition detected');
logger.error('Error occurred', error);
```

### Styling

- Use Tailwind CSS for styling
- Follow mobile-first approach
- Use design tokens from `tailwind.config.js`

```tsx
<button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark">
  Click Me
</button>
```

### File Naming

- Components: PascalCase (`ProductCard.tsx`)
- Utilities: camelCase (`utils.ts`)
- Hooks: camelCase with `use` prefix (`useFileUpload.ts`)
- Types: PascalCase (`types/index.ts`)

## 🧪 Testing

We use Vitest + React Testing Library for testing.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

Place tests in `src/__tests__/` mirroring the source structure:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Test Coverage Goals

- Utilities: 80%+ coverage
- Components: 60%+ coverage
- API routes: 70%+ coverage

## 📝 Commit Guidelines

We follow conventional commits for clear history:

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(cad-analyzer): add support for DXF files
fix(api): handle empty file uploads gracefully
docs(readme): update installation instructions
refactor(utils): extract file validation to custom hook
test(product-card): add unit tests for price formatting
chore(deps): update dependencies to latest versions
```

## 🔄 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Add tests for new functionality
   - Ensure all tests pass

3. **Run checks**
   ```bash
   npm run lint
   npm test
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push to your branch**
   ```bash
   git push origin feat/your-feature-name
   ```

6. **Open a Pull Request**
   - Provide a clear description
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure CI passes

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No console.log statements in production code
- [ ] Build succeeds without warnings
- [ ] Commits follow conventional commit format

## 🐛 Reporting Bugs

When reporting bugs, please include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, Node version)

## 💡 Feature Requests

We welcome feature requests! Please:

- Check existing issues first
- Provide clear use case
- Explain expected behavior
- Include mockups if applicable

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Maintain professional communication

---

Thank you for contributing to SteelSmart! 🎉
