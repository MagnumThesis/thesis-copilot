# Project Structure

## Directory Organization

```
src/
├── components/          # Reusable UI components
│   └── ui/             # Base UI components (buttons, dialogs, etc.)
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and services
│   └── api/           # API client functions
├── react-app/          # Main React application
│   ├── components/     # App-specific components
│   ├── pages/         # Route components
│   └── models/        # Data models
├── tests/              # Test files (co-located with source)
├── types/              # TypeScript type definitions
├── utils/              # Pure utility functions
└── worker/             # Cloudflare Workers backend
    ├── handlers/       # API route handlers
    ├── lib/           # Worker-specific utilities
    └── types/         # Worker type definitions
```

## Naming Conventions

### Files & Directories
- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAIModeManager.ts`)
- **Utilities**: kebab-case (`ai-error-handler.ts`)
- **Types**: kebab-case (`search-result-types.ts`)
- **Tests**: Match source file with `.test.` suffix

### Code Conventions
- **Components**: PascalCase with descriptive names
- **Functions**: camelCase with verb-noun pattern
- **Constants**: SCREAMING_SNAKE_CASE
- **Interfaces**: PascalCase with descriptive names
- **Enums**: PascalCase with singular names

## Import Patterns

```typescript
// External libraries first
import { useState } from 'react';
import { Hono } from 'hono';

// Internal imports with @ alias
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Relative imports last
import './component.css';
```

## Component Structure

- Use functional components with TypeScript
- Implement proper prop interfaces
- Include JSDoc comments for complex components
- Follow accessibility guidelines (ARIA labels, keyboard navigation)
- Use Radix UI primitives as base components