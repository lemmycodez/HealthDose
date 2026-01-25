# The Hytel Way: Monorepo Stack

A production-ready monorepo template featuring React, TypeScript, Tailwind CSS, Shadcn UI, tRPC, and TanStack Query. Built with pnpm and Turborepo for optimal developer experience.

## Stack Overview

Think of building a web app like putting on a theater production!

| Tool | Role | Analogy |
|------|------|---------|
| **pnpm** | Package Manager | The super-organized prop master |
| **Turborepo** | Build System | The stage manager coordinating tasks |
| **React + Vite** | Frontend | The stage and lighting system |
| **TypeScript** | Type Safety | The script ensuring everyone knows their lines |
| **Tailwind CSS** | Styling | The costume designer's fabric swatches |
| **Shadcn UI** | Components | Pre-made costume patterns |
| **tRPC** | API Layer | The messenger between actors |
| **TanStack Query** | Data Fetching | Smart caching (remembers the script!) |
| **Vitest** | Testing | Dress rehearsals before the show |
| **Zod** | Validation | The bouncer checking IDs |

## Monorepo Structure

```
├── apps/
│   ├── web/              # React frontend (Vite + Tailwind)
│   │   ├── src/
│   │   │   ├── App.tsx   # Main application component
│   │   │   ├── hooks/    # Custom React hooks (useUsers, etc.)
│   │   │   ├── lib/      # Utilities (tRPC client, query client)
│   │   │   └── providers/# Context providers
│   │   └── public/       # Static assets
│   │
│   └── functions/        # tRPC backend (stubbed for development)
│       └── src/trpc/     # API routers and procedures
│
├── packages/
│   ├── ui/               # Shared React components
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── Counter.tsx
│   │   │   └── ui/       # Shadcn UI components (Button, Card)
│   │   └── lib/utils.ts  # Tailwind class merging utility
│   │
│   ├── shared/           # Shared Zod schemas & types
│   │   └── src/schemas/  # User schemas, validation rules
│   │
│   └── config/           # Shared TypeScript configuration
│
├── turbo.json            # Turborepo pipeline configuration
├── pnpm-workspace.yaml   # Workspace definition
└── package.json          # Root scripts
```

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd react-mono-repo-template

# Install dependencies
pnpm install
```

### Development

```bash
# Start the development server
pnpm dev
# Opens at http://localhost:5173

# Run tests
pnpm test

# Build for production
pnpm build

# Lint code
pnpm lint

# Format code
pnpm format
```

## Key Features

### Shared Components (`packages/ui`)

Components in `@repo/ui` can be used by any app in the monorepo:

```tsx
import { Header } from '@repo/ui/Header'
import { Button } from '@repo/ui/Button'
import { Card, CardHeader, CardContent } from '@repo/ui/Card'
```

### Type-Safe API (`apps/functions`)

tRPC provides end-to-end type safety:

```tsx
// Backend (apps/functions)
export const userRouter = router({
  create: publicProcedure
    .input(CreateUserSchema)
    .mutation(({ input }) => ({ id: 'new-id', ...input })),
})

// Frontend (apps/web)
const { mutate } = trpc.user.create.useMutation()
```

### Shared Schemas (`packages/shared`)

Zod schemas shared between frontend and backend:

```tsx
import { UserSchema, CreateUserSchema } from '@repo/shared'

// Type-safe validation everywhere!
const user = UserSchema.parse(data)
```

## Testing

Each package has its own tests:

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter web test
pnpm --filter @repo/ui test
pnpm --filter @repo/shared test
pnpm --filter @repo/functions test
```

## Adding New Packages

### New App

```bash
mkdir apps/new-app
cd apps/new-app
pnpm init
```

### New Shared Package

```bash
mkdir packages/new-package
cd packages/new-package
pnpm init
```

Then add to `pnpm-workspace.yaml` (already configured for `apps/*` and `packages/*`).

## Tips for Experimenting

1. **Safe to edit**: `apps/web/src/App.tsx` - Main UI, experiment freely!
2. **Add components**: Create new files in `packages/ui/components/`
3. **Add schemas**: Extend `packages/shared/src/schemas/`
4. **Don't break**: Avoid modifying `turbo.json` or workspace config unless needed

## Useful Links

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Shadcn UI Components](https://ui.shadcn.com)
- [tRPC Documentation](https://trpc.io)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite](https://vitejs.dev)

## Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development servers |
| `pnpm build` | Build all packages for production |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format code with Prettier |

---

Built with Turborepo
