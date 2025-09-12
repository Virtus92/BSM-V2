# Copilot Instructions for AI Coding Agents

## Project Overview
This is a Next.js + Supabase starter kit, designed for full-stack development with SSR, authentication, and real-time features. The architecture leverages Next.js App Router, Supabase Auth (cookie-based), and Realtime, with Tailwind CSS and shadcn/ui for UI components.

## Key Directories & Files
- `app/` – Next.js routes, layouts, and pages (auth flows, protected routes)
- `components/` – UI and auth forms, shadcn/ui patterns
- `lib/supabase/` – Supabase client, server, and middleware setup
- `.cursor/rules/` – Project-specific rules for DB functions, RLS, migrations, realtime, SQL style, and edge functions

## Developer Workflows
- **Local Development:**
  - Start: `npm run dev` (default port 3000)
  - Environment: Copy `.env.example` to `.env.local` and set Supabase keys
- **Deploy:**
  - Vercel integration auto-assigns env vars
- **Database Migrations:**
  - Use Supabase CLI; migrations go in `supabase/migrations/` with UTC timestamped filenames
- **Edge Functions:**
  - Write in TypeScript/Deno, prefer built-in APIs, use `npm:`/`jsr:` for external deps

## Supabase Patterns
- **DB Functions:**
  - Use `SECURITY INVOKER`, set `search_path=''`, fully qualify object names
  - Prefer `IMMUTABLE`/`STABLE` unless side effects needed
- **RLS Policies:**
  - Write separate policies for select/insert/update/delete
  - Use `auth.uid()` for user checks, always specify roles
  - Add indexes for columns used in policies
- **Realtime:**
  - Prefer `broadcast` over `postgres_changes` for scalability
  - Use dedicated topics (`scope:entity:id`), snake_case events
  - Always include cleanup/unsubscribe logic
  - Set `private: true` for secure channels

## Coding Conventions
- **SQL:**
  - Lowercase keywords, snake_case names, plural tables, singular columns
  - Always add schema to queries, comment tables and complex logic
- **React:**
  - Use state management for subscriptions, cleanup in `useEffect`
- **Edge Functions:**
  - Use `/tmp` for file writes, prefer Deno APIs, avoid bare specifiers

## Integration Points
- **Supabase Auth:**
  - Cookie-based, session available across client/server/middleware
- **Realtime:**
  - Use triggers and `realtime.broadcast_changes` for DB notifications
- **UI:**
  - shadcn/ui components, Tailwind for styling

## Examples
- See `.cursor/rules/` for templates and best practices for DB, RLS, migrations, realtime, SQL, and edge functions
- Reference `lib/supabase/` for client/server setup
- Use `components/auth-button.tsx`, `components/login-form.tsx` for auth flows

---
For unclear or missing conventions, ask the user for clarification or examples from their codebase.
