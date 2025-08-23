# Technology Stack

## Core Technologies

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 6.0 for fast development and optimized builds
- **Backend**: Hono framework running on Cloudflare Workers
- **Database**: PostgreSQL with Supabase
- **Styling**: Tailwind CSS 4.1 with Radix UI components
- **Editor**: Milkdown for markdown editing with academic features

## Key Libraries

### AI Integration
- `@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/react` for AI functionality
- `@openrouter/ai-sdk-provider` for model routing
- `bottleneck` for rate limiting AI requests

### UI Components
- `@radix-ui/*` components for accessible UI primitives
- `framer-motion` for animations
- `lucide-react` for icons
- `sonner` for toast notifications

### Academic Features
- `cheerio` and `puppeteer` for web scraping academic sources
- `natural` and `node-nlp` for text analysis
- `string-similarity` for content matching
- `shiki` for syntax highlighting

### Development Tools
- `vitest` for testing with `@testing-library/react`
- `eslint` with TypeScript support
- `rollup-plugin-visualizer` for bundle analysis

## Common Commands

```bash
# Development
npm run dev              # Start development server (localhost:5173)
npm run build           # Build for production
npm run preview         # Preview production build locally

# Testing
npm run test            # Run test suite with Vitest
npm run lint            # Run ESLint

# Deployment
npm run deploy          # Deploy to Cloudflare Workers
npm run check           # Type check and dry-run deployment
npm run cf-typegen      # Generate Cloudflare Worker types
```

## Architecture Patterns

- **Monorepo Structure**: Single repository with frontend and backend
- **API-First Design**: Hono backend provides REST APIs consumed by React frontend
- **Component-Based UI**: Reusable React components with TypeScript interfaces
- **Hook-Based State**: Custom React hooks for complex state management
- **Error Boundaries**: Comprehensive error handling with recovery strategies
- **Performance Optimization**: Code splitting, lazy loading, and bundle optimization