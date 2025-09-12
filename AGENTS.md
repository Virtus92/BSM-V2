# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router routes, layouts, and server components.
- `components/`: Reusable UI and feature components (kebab-case files, PascalCase exports).
- `lib/`: Shared utilities and Supabase clients (`@/lib/...`).
- Tests live next to source as `*.test.ts(x)` or under `__tests__/`.

## Build, Test, and Development Commands
- `npm run dev` — Start local dev server (Turbopack) at `localhost:3000`.
- `npm run build` — Production build of the Next.js app.
- `npm run start` — Run the built app in production mode.
- `npm run lint` — ESLint (Next + TypeScript rules).
- `npm run type-check` — TypeScript type checking, no emit.
- `npm run test` | `test:watch` | `test:coverage` — Jest with jsdom; coverage report.

## Coding Style & Naming Conventions
- Language: TypeScript (strict). Prefer `@/*` path aliases from `tsconfig.json`.
- Files: kebab-case for component/files (e.g., `login-form.tsx`), directories lowercase.
- Exports: React components in PascalCase; variables/functions in camelCase.
- Linting: ESLint (`next/core-web-vitals`, `next/typescript`). Fix warnings before PR.
- Styling: Tailwind CSS; prefer utility-first classes and shared UI in `components/ui`.

## Testing Guidelines
- Frameworks: Jest + React Testing Library, `jsdom` env.
- Coverage: Global threshold 70% (branches, functions, lines, statements).
- Naming: `*.test.ts` / `*.test.tsx`. Keep tests close to implementation.
- Run locally: `npm test` and `npm run test:coverage` before submitting.

## Commit & Pull Request Guidelines
- Commits: Imperative mood, concise scope. Emoji prefixes allowed (e.g., `✨ feat: ...`, `🐛 fix: ...`).
- PRs: Clear description, rationale, and checklist of changes. Link issues. Include screenshots/GIFs for UI.
- Quality gate: Ensure `lint`, `type-check`, and `test` pass. Keep PRs focused and small.

## Security & Configuration Tips
- Secrets: Never commit `.env*`. Copy from `.env.example` to `.env.local` and set Supabase vars (`NEXT_PUBLIC_SUPABASE_*`).
- Auth: Middleware and SSR clients handle sessions; avoid exposing server-only data in client components.

## Agent-Specific Instructions
- Respect this file’s scope. Prefer minimal, targeted changes; avoid unrelated refactors.
- Match existing patterns in `app/`, `components/`, and `lib/`. Update docs/tests when behavior changes.
