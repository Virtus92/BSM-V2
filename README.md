# BSM‑V2

Request Management • CRM • Automation Hub

By Dinel Kurtovic

BSM‑V2 helps small teams capture requests, manage customers, and automate work. Simple to run. Easy to extend.

## What You Get
- Request Management: inbox of contact requests with notes and status.
- CRM: lightweight customer profiles with safe access controls.
- Automation Hub: n8n‑powered workflows, live monitoring, and an AI chat.

## Quick Start
1) Install: `npm install`
2) Configure: copy `.env.example` → `.env.local` and add Supabase (and optional n8n) vars
3) Database: apply SQL in `supabase/migrations` (filename order). Optional: `supabase/seed.sql`
4) Run: `npm run dev` → http://localhost:3000

Optional n8n (local)
- `docker compose up -d postgres n8n`
- In n8n, create a Chat Trigger workflow and set webhooks (`NEXT_PUBLIC_N8N_WEBHOOK_URL`).

## Tech
- Next.js 15, TypeScript, Tailwind, shadcn/ui
- Supabase (auth + Postgres)
- Jest + React Testing Library
