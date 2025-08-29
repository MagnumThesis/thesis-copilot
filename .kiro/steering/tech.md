---
inclusion: always
---

# Technology Stack & Development Guidelines

## Core Technologies

- **Frontend**: React 19 with TypeScript (strict mode)
- **Build Tool**: Vite 6.0 with path aliases (@/*)
- **Backend**: Hono framework on Cloudflare Workers
- **Styling**: Tailwind CSS 4.1 with Radix UI primitives
- **Editor**: Milkdown markdown editor with GFM support
- **Database**: PostgreSQL with Supabase integration

## Key Libraries & Patterns

### UI Development
- Use Radix UI primitives as base components for accessibility
- Framer Motion for animations (prefer subtle, purposeful motion)
- Lucide React for consistent iconography
- class-variance-authority (cva) for component variants
- Tailwind CSS utility classes (avoid custom CSS when possible)

### AI Integration
- @ai-sdk/openai, @ai-sdk/google, @openrouter/ai-sdk-provider
- Always implement provider fallbacks and error handling
- Use unified AI interface patterns across the application

### Development Standards
- ESLint with TypeScript and JSDoc plugins (must pass linting)
- Vitest for testing with @testing-library/react
- TypeDoc for API documentation generation
- Strict TypeScript configuration with no implicit any

## Code Style Requirements

### TypeScript
- Use strict mode with explicit return types for functions
- Prefer interfaces over types for object shapes
- Use proper JSDoc comments for complex functions
- Implement proper error boundaries and type guards

### React Patterns
- Functional components with proper TypeScript props
- Custom hooks for reusable logic (prefix with `use`)
- Component composition over inheritance
- Proper accessibility attributes (ARIA labels, keyboard navigation)

### Import Organization
```typescript
// 1. External libraries
import { useState } from 'react';
import { Hono } from 'hono';

// 2. Internal with @ alias
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// 3. Relative imports
import './styles.css';
```

## Architecture Patterns

### Frontend
- React Router for client-side routing
- Custom hooks for state management (avoid prop drilling)
- Component composition with Radix UI primitives
- Responsive design with mobile-first approach

### Backend (Cloudflare Workers)
- Hono framework with typed routes
- Edge computing patterns for global performance
- Environment-based configuration
- Proper CORS and security headers

### Database
- Supabase client with proper connection pooling
- Type-safe database queries with generated types
- Migration-based schema management

## Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Quality Assurance
npm test                # Run test suite
npm run lint            # Run ESLint (must pass)
npm run type-check      # TypeScript type checking

# Deployment
npm run deploy          # Deploy to Cloudflare Workers
npm run check           # Dry-run deployment check

# Documentation
npm run docs:dev        # Start docs development server
npm run docs:build      # Build documentation
```

## Performance Guidelines

- Lazy load components and routes where appropriate
- Optimize bundle size with proper tree shaking
- Use React.memo for expensive components
- Implement proper loading states and error boundaries
- Leverage Cloudflare Workers edge caching