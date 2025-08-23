# Project Structure

## Root Directory

```
├── src/                    # Source code
├── migrations/             # Database schema migrations
├── docs/                   # Documentation files
├── public/                 # Static assets
├── dist/                   # Build output
├── .kiro/                  # Kiro configuration and specs
└── scripts/                # Utility scripts
```

## Source Code Organization (`src/`)

### Frontend Structure
```
src/
├── react-app/             # Main React application
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── models/           # Data models
│   └── assets/           # Static assets
├── components/           # Shared UI components
│   └── ui/              # Radix UI component wrappers
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries and services
├── utils/               # Helper functions
├── tests/               # Test files
└── types.ts             # Global type definitions
```

### Backend Structure
```
src/worker/
├── handlers/            # API route handlers
├── lib/                # Backend utilities
├── types/              # Backend type definitions
└── index.ts            # Main worker entry point
```

## Key Conventions

### File Naming
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAiModeManager.ts`)
- **Utilities**: kebab-case (e.g., `text-analysis.ts`)
- **API Handlers**: kebab-case (e.g., `builder-ai.ts`)
- **Types**: camelCase interfaces, PascalCase enums

### Import Aliases
- `@/*` maps to `./src/*` for clean imports
- Use absolute imports for shared utilities and components
- Relative imports only for closely related files

### Component Structure
- Each major feature has its own component directory
- Shared UI components use Radix UI primitives
- Custom hooks for complex state management
- Separate test files alongside components

### API Structure
- RESTful endpoints under `/api/`
- Feature-based handler organization
- Consistent error handling and logging
- Type-safe request/response interfaces

### Database Conventions
- Migration files prefixed with version (e.g., `v1_`, `v2_`)
- UUID primary keys for main entities
- Timestamp fields (`created_at`, `updated_at`) on all tables
- Foreign key constraints with CASCADE deletes where appropriate

### Testing Organization
- Test files co-located with source files
- Integration tests for API endpoints
- Component tests for UI interactions
- Performance tests for AI operations
- Accessibility tests for UI components