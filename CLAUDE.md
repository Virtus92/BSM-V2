# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is Rising BSM V2, a Business Service Management Platform built with Next.js 15 and Supabase. The project includes comprehensive CI/CD pipelines, testing infrastructure, and Docker containerization for enterprise-grade deployment.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Update Supabase environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` - Your Supabase anon key

Both variables can be found in your Supabase project's API settings.

### Docker Commands
- `docker build -t rising-bsm-v2 .` - Build Docker image
- `docker run -p 3000:3000 rising-bsm-v2` - Run container locally

### Testing Commands
- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode during development
- `npm run test:coverage` - Generate coverage report (target: 70%)

## Architecture Overview

### Core Stack
- **Next.js 15** with App Router and React 19
- **Supabase** for authentication and database with SSR support (`@supabase/ssr`)
- **Tailwind CSS** for styling with shadcn/ui components
- **TypeScript** with strict configuration
- **next-themes** for theme switching (light/dark mode)
- **Jest** with React Testing Library for comprehensive testing
- **Docker** for containerized deployments
- **GitHub Actions** for CI/CD automation

### Project Structure
```
app/                          # Next.js App Router pages
├── auth/                     # Authentication pages and routes
│   ├── login/                # Login page
│   ├── sign-up/             # Sign up page
│   ├── forgot-password/     # Password reset
│   ├── update-password/     # Update password
│   ├── confirm/route.ts     # Email confirmation handler
│   └── error/               # Auth error page
├── protected/               # Protected routes (requires authentication)
├── layout.tsx              # Root layout with theme provider
└── page.tsx                # Home page

components/                  # React components
├── ui/                     # shadcn/ui components (Button, Card, Input, etc.)
├── tutorial/               # Tutorial step components
├── auth-button.tsx         # Authentication state button
├── login-form.tsx          # Login form component
├── sign-up-form.tsx        # Sign up form component
├── theme-switcher.tsx      # Theme toggle component
└── ...                     # Other utility components

lib/                        # Utility libraries
├── supabase/              # Supabase client configurations
│   ├── client.ts          # Browser client
│   ├── server.ts          # Server client with cookie handling
│   └── middleware.ts      # Middleware for session management
└── utils.ts               # Utility functions (cn helper, env check)

.github/workflows/         # CI/CD workflows
├── ci.yml                 # Continuous Integration (lint, test, build)
└── deploy.yml             # Deployment pipeline

jest.config.js             # Jest testing configuration
jest.setup.js              # Jest setup and mocks
Dockerfile                 # Docker container configuration
.dockerignore              # Docker ignore patterns
```

### Authentication Flow
- **Client-side**: Uses browser client from `lib/supabase/client.ts`
- **Server-side**: Uses server client from `lib/supabase/server.ts` with cookie-based sessions
- **Middleware**: Handles session refresh in `middleware.ts` using `lib/supabase/middleware.ts`
- **Route Protection**: Protected routes check authentication in server components and redirect to login if needed

### Key Architectural Patterns

#### Supabase Client Pattern
The project uses three different Supabase client configurations:
- **Browser client**: For client-side operations in React components
- **Server client**: For server-side operations with cookie handling for sessions
- **Middleware client**: For session management and refresh in middleware

#### Component Organization
- **UI Components**: Located in `components/ui/` following shadcn/ui conventions
- **Form Components**: Authentication forms with built-in validation and error handling
- **Layout Components**: Navigation and page structure components
- **Tutorial Components**: Step-by-step guidance components for setup and usage

#### Theme System
- Uses `next-themes` with system preference detection
- CSS variables defined in `app/globals.css` for consistent theming
- Tailwind configured with CSS variables for dynamic theme switching

## Configuration Files

### Important Configurations
- **components.json**: shadcn/ui configuration with "new-york" style
- **tailwind.config.ts**: Extended with shadcn/ui color variables and animations
- **tsconfig.json**: Strict TypeScript with path aliases (`@/*` maps to root)
- **eslint.config.mjs**: Next.js and TypeScript ESLint rules
- **middleware.ts**: Session management for all routes except static assets

### shadcn/ui Setup
The project uses shadcn/ui with:
- Style: "new-york"
- Components in `@/components/ui`
- Utils in `@/lib/utils`
- Lucide icons
- CSS variables for theming

## Development Guidelines

### Authentication Development
- Always use appropriate Supabase client (browser vs server)
- Server components should use `createClient()` from `@/lib/supabase/server`
- Client components should use `createClient()` from `@/lib/supabase/client`
- Protected pages should check authentication and redirect if needed

### Styling Patterns
- Use Tailwind CSS classes with shadcn/ui component patterns
- Utilize the `cn()` utility from `@/lib/utils` for conditional classes
- Follow the established color scheme using CSS variables
- Components should support both light and dark themes

### Component Development
- New UI components should be added to `components/ui/` if reusable
- Use TypeScript interfaces for component props
- Follow the existing naming and structure conventions
- Implement proper error handling and loading states

## Common Patterns

### Server Component Authentication Check
```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  
  if (error || !data?.claims) {
    redirect("/auth/login");
  }
  // ... component logic
}
```

### Client Component with Supabase
```typescript
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function ClientComponent() {
  const supabase = createClient();
  // ... component logic
}
```

## CI/CD Pipeline

### GitHub Actions Workflows

**CI Pipeline (`.github/workflows/ci.yml`)**:
- Runs on push to main/develop branches and all pull requests
- Steps: Lint → Type Check → Test → Build
- Test coverage requirement: 70% minimum
- Uploads coverage reports to Codecov

**Deployment Pipeline (`.github/workflows/deploy.yml`)**:
- Runs on push to main branch or manual trigger
- Steps: Test → Build → Docker Build → Container Registry → Deploy
- Supports Vercel deployment with environment variables
- Automatic container image publishing to GitHub Container Registry

### Docker Configuration

**Multi-stage Dockerfile**:
- Base image: Node.js 20 Alpine
- Production optimization with standalone output
- Security: Non-root user (nextjs:nodejs)
- Size optimization through layer caching

**Docker Compose (for local development)**:
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=your-url
      - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-key
```

## Testing Strategy

### Test Configuration
- **Framework**: Jest with jsdom environment
- **Library**: React Testing Library for component testing
- **Coverage**: 70% threshold for branches, functions, lines, statements
- **Mocks**: Next.js router, Supabase client, environment variables

### Test Types
- **Unit Tests**: Component logic and utility functions
- **Integration Tests**: API routes and database interactions
- **Coverage Reports**: Automated generation and CI integration

### Running Tests
```bash
# Development
npm run test:watch    # Watch mode with hot reload

# CI/CD
npm run test:coverage # Generate coverage reports

# Single run
npm test             # Run all tests once
```

## Deployment Options

### 1. Vercel (Recommended)
- One-click deployment with GitHub integration
- Automatic environment variable management
- Serverless functions and edge runtime support
- Built-in analytics and performance monitoring

### 2. Docker Container
- Supports any container orchestration platform
- Kubernetes, Docker Swarm, or standalone deployment
- Environment variable injection at runtime
- Health checks and graceful shutdown

### 3. Traditional Hosting
- Build with `npm run build`
- Serve static files from `.next/static`
- Node.js server for dynamic routes

The project follows Next.js 15 best practices with proper separation of client and server code, type safety, and modern authentication patterns.