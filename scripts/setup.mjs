#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import crypto from 'crypto'
import path from 'path'

const root = process.cwd()
const envPath = path.join(root, '.env')
const envLocalPath = path.join(root, '.env.local')
const templatePath = path.join(root, 'n8n', 'credentials_overwrite.template.json')
const outCredsPath = path.join(root, 'n8n', 'credentials_overwrite.json')

function genSecret(len = 32) {
  return crypto.randomBytes(len).toString('hex')
}

function parseEnv(text) {
  const out = {}
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i.exec(line)
    if (!m) continue
    const key = m[1]
    let val = m[2]
    if (val?.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
    out[key] = val
  }
  return out
}

function dumpEnv(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n'
}

function loadEnv(file) {
  return existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : {}
}

const env = loadEnv(envPath)
const envLocal = loadEnv(envLocalPath)

// Ensure base directories
mkdirSync(path.join(root, 'n8n'), { recursive: true })

// Generate N8N + Postgres defaults if missing
env.N8N_DB_USER ||= 'n8n'
env.N8N_DB_PASSWORD ||= genSecret(12)
env.N8N_DB_NAME ||= 'n8n'
env.N8N_ENCRYPTION_KEY ||= genSecret(24)
env.N8N_API_KEY ||= genSecret(24)

// Propagate Supabase vars into .env if present only in .env.local
if (envLocal.NEXT_PUBLIC_SUPABASE_URL && !env.NEXT_PUBLIC_SUPABASE_URL) env.NEXT_PUBLIC_SUPABASE_URL = envLocal.NEXT_PUBLIC_SUPABASE_URL
if (envLocal.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY && !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY) env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY = envLocal.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
if (envLocal.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY) env.SUPABASE_SERVICE_ROLE_KEY = envLocal.SUPABASE_SERVICE_ROLE_KEY

// Write .env
writeFileSync(envPath, dumpEnv(env), 'utf8')
console.log('Wrote .env with generated secrets.')

// Generate credentials_overwrite.json for n8n if template + supabase vars present
try {
  const tpl = readFileSync(templatePath, 'utf8')
  const resolved = tpl
    .replaceAll('${NEXT_PUBLIC_SUPABASE_URL}', env.NEXT_PUBLIC_SUPABASE_URL || envLocal.NEXT_PUBLIC_SUPABASE_URL || '')
    .replaceAll('${SUPABASE_SERVICE_ROLE_KEY}', env.SUPABASE_SERVICE_ROLE_KEY || envLocal.SUPABASE_SERVICE_ROLE_KEY || '')
  writeFileSync(outCredsPath, resolved, 'utf8')
  console.log('Wrote n8n/credentials_overwrite.json.')
} catch (e) {
  console.warn('Skipped credentials_overwrite.json (missing template or env).')
}

console.log('Done. Next steps:')
console.log('- Ensure Supabase env vars are set in .env or .env.local')
console.log('- Run: docker compose up -d --build')

