# Technology Stack

## Core Technologies

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 6.0
- **Backend**: Hono framework on Cloudflare Workers
- **Styling**: Tailwind CSS 4.1 with Radix UI components
- **Editor**: Milkdown markdown editor with GFM support
- **Database**: PostgreSQL with Supabase integration

## Key Libraries

### UI & Styling
- Radix UI primitives for accessible components
- Framer Motion for animations
- Lucide React for icons
- class-variance-authority for component variants

### AI Integration
- @ai-sdk/openai, @ai-sdk/google, @openrouter/ai-sdk-provider
- Multiple AI provider support with unified interface

### Development Tools
- ESLint with TypeScript and JSDoc plugins
- Vitest for testing with @testing-library/react
- TypeDoc for documentation generation

## Common Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Testing & Quality
npm test                # Run test suite
npm run lint            # Run ESLint

# Deployment
npm run deploy          # Deploy to Cloudflare Workers
npm run check           # Type check and dry-run deploy

# Documentation
npm run docs:dev        # Start docs development server
npm run docs:build      # Build documentation
```

## Architecture Patterns

- Cloudflare Workers for edge computing
- React Router for client-side routing
- Custom hooks for state management
- Component composition with Radix UI
- TypeScript strict mode with path aliases (@/*)